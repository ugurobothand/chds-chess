// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ChessPass.sol";
import "./ChineseChess.sol";

/// @notice Players list themselves as available and challenge each other.
contract ChessLobby is Ownable, ReentrancyGuard {
    ChessPass public immutable chessPass;
    ChineseChess public chineseChess;

    struct OpenGame {
        address player;
        uint256 wager;
        uint256 createdAt;
        bool active;
    }

    uint256 public nextGameListingId;
    mapping(uint256 => OpenGame) public openGames;
    mapping(address => bool) public hasActiveListing;

    event GameListed(uint256 indexed listingId, address indexed player, uint256 wager);
    event GameStarted(uint256 indexed listingId, uint256 indexed gameId, address player1, address player2);
    event GameCancelled(uint256 indexed listingId);

    error NoPass();
    error AlreadyListed();
    error ListingNotActive();
    error NotYourListing();
    error CannotJoinOwnGame();
    error WrongWagerAmount();

    modifier onlyPassHolder() {
        if (!chessPass.hasPass(msg.sender)) revert NoPass();
        _;
    }

    constructor(address _chessPass) Ownable(msg.sender) {
        chessPass = ChessPass(_chessPass);
    }

    function setChineseChess(address _chineseChess) external onlyOwner {
        chineseChess = ChineseChess(_chineseChess);
    }

    function listGame(uint256 wager) external payable onlyPassHolder {
        if (msg.value != wager) revert WrongWagerAmount();
        if (hasActiveListing[msg.sender]) revert AlreadyListed();

        hasActiveListing[msg.sender] = true;
        uint256 listingId = nextGameListingId++;
        openGames[listingId] = OpenGame({player: msg.sender, wager: wager, createdAt: block.timestamp, active: true});

        emit GameListed(listingId, msg.sender, wager);
    }

    function joinGame(uint256 listingId) external payable onlyPassHolder nonReentrant {
        OpenGame storage listing = openGames[listingId];

        if (!listing.active) revert ListingNotActive();
        if (listing.player == msg.sender) revert CannotJoinOwnGame();
        if (msg.value != listing.wager) revert WrongWagerAmount();

        listing.active = false;
        hasActiveListing[listing.player] = false;

        uint256 gameId = chineseChess.createGame{value: listing.wager * 2}(listing.player, msg.sender, listing.wager);

        emit GameStarted(listingId, gameId, listing.player, msg.sender);
    }

    function cancelGame(uint256 listingId) external nonReentrant {
        OpenGame storage listing = openGames[listingId];

        if (!listing.active) revert ListingNotActive();
        if (listing.player != msg.sender) revert NotYourListing();

        listing.active = false;
        hasActiveListing[msg.sender] = false;

        if (listing.wager > 0) {
            (bool ok,) = msg.sender.call{value: listing.wager}("");
            require(ok, "Refund failed");
        }

        emit GameCancelled(listingId);
    }

    function getOpenGames() external view returns (uint256[] memory ids, OpenGame[] memory gamesList) {
        uint256 count;
        for (uint256 i = 0; i < nextGameListingId; i++) {
            if (openGames[i].active) count++;
        }

        ids = new uint256[](count);
        gamesList = new OpenGame[](count);
        uint256 idx;
        for (uint256 i = 0; i < nextGameListingId; i++) {
            if (openGames[i].active) {
                ids[idx] = i;
                gamesList[idx] = openGames[i];
                idx++;
            }
        }
    }
}
