// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Core game contract. Stores board state and validates moves.
contract ChineseChess is ReentrancyGuard, Ownable {
    // ─── Enums ───────────────────────────────────────────────────────────────

    enum GameStatus {
        Waiting,
        Active,
        Finished,
        Draw
    }
    enum Winner {
        None,
        Player1,
        Player2
    }

    // ─── Structs ─────────────────────────────────────────────────────────────

    struct Game {
        address player1; // Red side
        address player2; // Black side
        uint8[90] board; // 9 columns x 10 rows, index = row*9 + col
        bool isPlayer1Turn;
        GameStatus status;
        Winner winner;
        uint256 wager;
        uint256 lastMoveTime;
        uint256 moveCount;
    }

    // ─── Piece Codes ─────────────────────────────────────────────────────────
    //
    // 0  = empty
    // Red pieces  (1–7):  1=General 2=Advisor 3=Elephant 4=Horse 5=Rook 6=Cannon 7=Soldier
    // Black pieces (11–17): 11=General 12=Advisor 13=Elephant 14=Horse 15=Rook 16=Cannon 17=Soldier

    // ─── State ───────────────────────────────────────────────────────────────

    uint256 public nextGameId;
    mapping(uint256 => Game) public games;
    mapping(address => uint256) public wins;
    mapping(address => uint256) public losses;

    uint256 public constant TIMEOUT = 10 minutes;

    address public lobby;

    constructor() Ownable(msg.sender) {}

    modifier onlyLobby() {
        require(msg.sender == lobby, "Not lobby");
        _;
    }

    function setLobby(address _lobby) external onlyOwner {
        lobby = _lobby;
    }

    // ─── Events ──────────────────────────────────────────────────────────────

    event GameCreated(uint256 indexed gameId, address player1, address player2, uint256 wager);
    event MoveMade(uint256 indexed gameId, address player, uint8 fromPos, uint8 toPos);
    event GameFinished(uint256 indexed gameId, Winner winner, address winnerAddress);
    event GameDraw(uint256 indexed gameId);

    // ─── Errors ──────────────────────────────────────────────────────────────

    error NotYourTurn();
    error InvalidMove();
    error GameNotActive();
    error TimeoutNotReached();
    error NotAPlayer();
    error WithdrawFailed();

    // ─── External ────────────────────────────────────────────────────────────

    function createGame(address player1, address player2, uint256 wager)
        external
        payable
        onlyLobby
        returns (uint256 gameId)
    {
        gameId = nextGameId++;

        Game storage g = games[gameId];
        g.player1 = player1;
        g.player2 = player2;
        g.wager = wager;
        g.isPlayer1Turn = true;
        g.status = GameStatus.Active;
        g.lastMoveTime = block.timestamp;

        _setupBoard(gameId);

        emit GameCreated(gameId, player1, player2, wager);
    }

    function submitMove(uint256 gameId, uint8 fromPos, uint8 toPos) external nonReentrant {
        Game storage g = games[gameId];

        if (g.status != GameStatus.Active) revert GameNotActive();
        if (g.isPlayer1Turn && msg.sender != g.player1) revert NotYourTurn();
        if (!g.isPlayer1Turn && msg.sender != g.player2) revert NotYourTurn();

        if (!_validateMove(g, fromPos, toPos)) revert InvalidMove();

        uint8 capturedPiece = g.board[toPos];
        g.board[toPos] = g.board[fromPos];
        g.board[fromPos] = 0;
        g.isPlayer1Turn = !g.isPlayer1Turn;
        g.lastMoveTime = block.timestamp;
        g.moveCount++;

        emit MoveMade(gameId, msg.sender, fromPos, toPos);

        if (capturedPiece == 1 || capturedPiece == 11) {
            _finishGame(gameId, g.isPlayer1Turn ? Winner.Player2 : Winner.Player1);
        }
    }

    function claimTimeout(uint256 gameId) external nonReentrant {
        Game storage g = games[gameId];

        if (g.status != GameStatus.Active) revert GameNotActive();
        if (msg.sender != g.player1 && msg.sender != g.player2) revert NotAPlayer();
        if (block.timestamp < g.lastMoveTime + TIMEOUT) revert TimeoutNotReached();

        // The player whose turn it is has timed out — opponent wins
        Winner winner = g.isPlayer1Turn ? Winner.Player2 : Winner.Player1;
        _finishGame(gameId, winner);
    }

    function resign(uint256 gameId) external nonReentrant {
        Game storage g = games[gameId];

        if (g.status != GameStatus.Active) revert GameNotActive();
        if (msg.sender != g.player1 && msg.sender != g.player2) revert NotAPlayer();

        Winner winner = (msg.sender == g.player1) ? Winner.Player2 : Winner.Player1;
        _finishGame(gameId, winner);
    }

    function getBoard(uint256 gameId) external view returns (uint8[90] memory) {
        return games[gameId].board;
    }

    function getGame(uint256 gameId)
        external
        view
        returns (
            address player1,
            address player2,
            bool isPlayer1Turn,
            GameStatus status,
            Winner winner,
            uint256 wager,
            uint256 moveCount
        )
    {
        Game storage g = games[gameId];
        return (g.player1, g.player2, g.isPlayer1Turn, g.status, g.winner, g.wager, g.moveCount);
    }

    // ─── Internal ────────────────────────────────────────────────────────────

    function _setupBoard(uint256 gameId) internal {
        uint8[90] memory board;

        // Black pieces — top (rows 0–4)
        board[0] = 15;
        board[1] = 14;
        board[2] = 13;
        board[3] = 12;
        board[4] = 11;
        board[5] = 12;
        board[6] = 13;
        board[7] = 14;
        board[8] = 15;
        board[19] = 16;
        board[25] = 16;
        board[27] = 17;
        board[29] = 17;
        board[31] = 17;
        board[33] = 17;
        board[35] = 17;

        // Red pieces — bottom (rows 5–9)
        board[81] = 5;
        board[82] = 4;
        board[83] = 3;
        board[84] = 2;
        board[85] = 1;
        board[86] = 2;
        board[87] = 3;
        board[88] = 4;
        board[89] = 5;
        board[64] = 6;
        board[70] = 6;
        board[54] = 7;
        board[56] = 7;
        board[58] = 7;
        board[60] = 7;
        board[62] = 7;

        games[gameId].board = board;
    }

    function _validateMove(Game storage g, uint8 fromPos, uint8 toPos) internal view returns (bool) {
        if (fromPos >= 90 || toPos >= 90) return false;
        if (fromPos == toPos) return false;

        uint8 piece = g.board[fromPos];
        if (piece == 0) return false;

        bool isRedPiece = piece <= 7;
        if (g.isPlayer1Turn != isRedPiece) return false;

        uint8 target = g.board[toPos];
        if (target != 0) {
            if (isRedPiece == (target <= 7)) return false; // capture own piece
        }

        uint8 fromRow = fromPos / 9;
        uint8 fromCol = fromPos % 9;
        uint8 toRow = toPos / 9;
        uint8 toCol = toPos % 9;
        uint8 pieceType = piece > 10 ? piece - 10 : piece;

        bool moveOk;
        if (pieceType == 1) moveOk = _validateGeneral(fromRow, fromCol, toRow, toCol, g.isPlayer1Turn);
        else if (pieceType == 2) moveOk = _validateAdvisor(fromRow, fromCol, toRow, toCol, g.isPlayer1Turn);
        else if (pieceType == 3) moveOk = _validateElephant(g.board, fromRow, fromCol, toRow, toCol, g.isPlayer1Turn);
        else if (pieceType == 4) moveOk = _validateHorse(g.board, fromRow, fromCol, toRow, toCol);
        else if (pieceType == 5) moveOk = _validateRook(g.board, fromRow, fromCol, toRow, toCol);
        else if (pieceType == 6) moveOk = _validateCannon(g.board, fromRow, fromCol, toRow, toCol, target);
        else if (pieceType == 7) moveOk = _validateSoldier(fromRow, fromCol, toRow, toCol, g.isPlayer1Turn);
        else return false;

        if (!moveOk) return false;
        return !_flyingGeneralCheck(g.board, fromPos, toPos);
    }

    // General: 1 step orthogonally, stays in palace (cols 3–5; Red rows 7–9, Black rows 0–2)
    function _validateGeneral(uint8 fromRow, uint8 fromCol, uint8 toRow, uint8 toCol, bool isRed)
        internal
        pure
        returns (bool)
    {
        if (toCol < 3 || toCol > 5) return false;
        if (isRed && toRow < 7) return false;
        if (!isRed && toRow > 2) return false;
        uint8 dr = _absDiff(fromRow, toRow);
        uint8 dc = _absDiff(fromCol, toCol);
        return (dr == 0 && dc == 1) || (dr == 1 && dc == 0);
    }

    // Advisor: 1 step diagonally, stays in palace
    function _validateAdvisor(uint8 fromRow, uint8 fromCol, uint8 toRow, uint8 toCol, bool isRed)
        internal
        pure
        returns (bool)
    {
        if (toCol < 3 || toCol > 5) return false;
        if (isRed && toRow < 7) return false;
        if (!isRed && toRow > 2) return false;
        return _absDiff(fromRow, toRow) == 1 && _absDiff(fromCol, toCol) == 1;
    }

    // Elephant: 2 steps diagonally, cannot cross river, midpoint must be empty
    function _validateElephant(
        uint8[90] storage board,
        uint8 fromRow,
        uint8 fromCol,
        uint8 toRow,
        uint8 toCol,
        bool isRed
    ) internal view returns (bool) {
        if (isRed && toRow < 5) return false;
        if (!isRed && toRow > 4) return false;
        if (_absDiff(fromRow, toRow) != 2 || _absDiff(fromCol, toCol) != 2) return false;
        uint8 midRow = (fromRow + toRow) / 2;
        uint8 midCol = (fromCol + toCol) / 2;
        return board[midRow * 9 + midCol] == 0;
    }

    // Horse: L-shape (2+1), first orthogonal step must be unblocked
    function _validateHorse(uint8[90] storage board, uint8 fromRow, uint8 fromCol, uint8 toRow, uint8 toCol)
        internal
        view
        returns (bool)
    {
        uint8 dr = _absDiff(fromRow, toRow);
        uint8 dc = _absDiff(fromCol, toCol);
        if (!((dr == 1 && dc == 2) || (dr == 2 && dc == 1))) return false;
        uint8 blockRow = fromRow;
        uint8 blockCol = fromCol;
        if (dr == 2) blockRow = toRow > fromRow ? fromRow + 1 : fromRow - 1;
        else blockCol = toCol > fromCol ? fromCol + 1 : fromCol - 1;
        return board[blockRow * 9 + blockCol] == 0;
    }

    // Rook: any distance orthogonally, no pieces between
    function _validateRook(uint8[90] storage board, uint8 fromRow, uint8 fromCol, uint8 toRow, uint8 toCol)
        internal
        view
        returns (bool)
    {
        if (fromRow != toRow && fromCol != toCol) return false;
        return _countBetween(board, fromRow, fromCol, toRow, toCol) == 0;
    }

    // Cannon: moves like Rook without capturing; captures by jumping over exactly 1 piece
    function _validateCannon(
        uint8[90] storage board,
        uint8 fromRow,
        uint8 fromCol,
        uint8 toRow,
        uint8 toCol,
        uint8 target
    ) internal view returns (bool) {
        if (fromRow != toRow && fromCol != toCol) return false;
        uint8 between = _countBetween(board, fromRow, fromCol, toRow, toCol);
        return target == 0 ? between == 0 : between == 1;
    }

    // Soldier: 1 step forward before river; 1 step forward or sideways after crossing
    function _validateSoldier(uint8 fromRow, uint8 fromCol, uint8 toRow, uint8 toCol, bool isRed)
        internal
        pure
        returns (bool)
    {
        uint8 dr = _absDiff(fromRow, toRow);
        uint8 dc = _absDiff(fromCol, toCol);
        if (dr + dc != 1) return false;
        if (isRed) {
            if (fromRow <= 4) {
                // crossed river: forward (row decreases) or sideways allowed
                if (dr == 1 && toRow > fromRow) return false; // no backward
            } else {
                // before river: only forward
                if (dc != 0 || toRow != fromRow - 1) return false;
            }
        } else {
            if (fromRow >= 5) {
                // crossed river: forward (row increases) or sideways allowed
                if (dr == 1 && toRow < fromRow) return false; // no backward
            } else {
                // before river: only forward
                if (dc != 0 || toRow != fromRow + 1) return false;
            }
        }
        return true;
    }

    // Flying General: returns true if the move leaves the two Generals facing each other with no pieces between
    function _flyingGeneralCheck(uint8[90] storage board, uint8 fromPos, uint8 toPos) internal view returns (bool) {
        uint8 redGenRow = 255;
        uint8 redGenCol = 255;
        uint8 blkGenRow = 255;
        uint8 blkGenCol = 255;

        for (uint8 i = 0; i < 90; i++) {
            uint8 p = (i == toPos) ? board[fromPos] : (i == fromPos ? 0 : board[i]);
            if (p == 1) {
                redGenRow = i / 9;
                redGenCol = i % 9;
            } else if (p == 11) {
                blkGenRow = i / 9;
                blkGenCol = i % 9;
            }
        }

        if (redGenCol == 255 || blkGenCol == 255 || redGenCol != blkGenCol) return false;

        uint8 lo = redGenRow < blkGenRow ? redGenRow : blkGenRow;
        uint8 hi = redGenRow > blkGenRow ? redGenRow : blkGenRow;
        for (uint8 r = lo + 1; r < hi; r++) {
            uint8 pos = r * 9 + redGenCol;
            uint8 p = (pos == toPos) ? board[fromPos] : (pos == fromPos ? 0 : board[pos]);
            if (p != 0) return false;
        }
        return true;
    }

    function _countBetween(uint8[90] storage board, uint8 fromRow, uint8 fromCol, uint8 toRow, uint8 toCol)
        internal
        view
        returns (uint8)
    {
        uint8 count = 0;
        if (fromRow == toRow) {
            uint8 lo = fromCol < toCol ? fromCol : toCol;
            uint8 hi = fromCol < toCol ? toCol : fromCol;
            for (uint8 c = lo + 1; c < hi; c++) {
                if (board[fromRow * 9 + c] != 0) count++;
            }
        } else {
            uint8 lo = fromRow < toRow ? fromRow : toRow;
            uint8 hi = fromRow < toRow ? toRow : fromRow;
            for (uint8 r = lo + 1; r < hi; r++) {
                if (board[r * 9 + fromCol] != 0) count++;
            }
        }
        return count;
    }

    function _absDiff(uint8 a, uint8 b) internal pure returns (uint8) {
        return a > b ? a - b : b - a;
    }

    function _finishGame(uint256 gameId, Winner winner) internal {
        Game storage g = games[gameId];
        g.status = GameStatus.Finished;
        g.winner = winner;

        address winnerAddr = (winner == Winner.Player1) ? g.player1 : g.player2;
        address loserAddr = (winner == Winner.Player1) ? g.player2 : g.player1;

        wins[winnerAddr]++;
        losses[loserAddr]++;

        emit GameFinished(gameId, winner, winnerAddr);

        if (g.wager > 0) {
            (bool ok,) = winnerAddr.call{value: g.wager * 2}("");
            require(ok, "Payout failed");
        }
    }
}
