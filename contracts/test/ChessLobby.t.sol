// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ChessPass.sol";
import "../src/ChessLobby.sol";
import "../src/ChineseChess.sol";

contract ChessLobbyTest is Test {
    ChessPass pass;
    ChineseChess chess;
    ChessLobby lobby;

    address owner = makeAddr("owner");
    address player1 = makeAddr("player1");
    address player2 = makeAddr("player2");
    address player3 = makeAddr("player3");

    uint256 constant MINT_PRICE = 0.01 ether;

    function setUp() public {
        vm.deal(owner, 10 ether);
        vm.deal(player1, 10 ether);
        vm.deal(player2, 10 ether);
        vm.deal(player3, 10 ether);

        vm.startPrank(owner);
        pass = new ChessPass();
        chess = new ChineseChess();
        lobby = new ChessLobby(address(pass));

        lobby.setChineseChess(address(chess));
        chess.setLobby(address(lobby));
        vm.stopPrank();

        // Mint passes for players
        vm.prank(player1);
        pass.mint{value: MINT_PRICE}();
        vm.prank(player2);
        pass.mint{value: MINT_PRICE}();
        vm.prank(player3);
        pass.mint{value: MINT_PRICE}();
    }

    function test_ListGame() public {
        vm.prank(player1);
        lobby.listGame{value: 0.1 ether}(0.1 ether);

        (uint256[] memory ids, ChessLobby.OpenGame[] memory games) = lobby.getOpenGames();
        assertEq(ids.length, 1);
        assertEq(games[0].player, player1);
        assertEq(games[0].wager, 0.1 ether);
        assertTrue(games[0].active);
    }

    function test_ListGameRequiresPass() public {
        address noPass = makeAddr("noPass");
        vm.deal(noPass, 1 ether);
        vm.prank(noPass);
        vm.expectRevert(ChessLobby.NoPass.selector);
        lobby.listGame{value: 0.1 ether}(0.1 ether);
    }

    function test_ListGameWrongWagerAmount() public {
        vm.prank(player1);
        vm.expectRevert(ChessLobby.WrongWagerAmount.selector);
        lobby.listGame{value: 0.05 ether}(0.1 ether);
    }

    function test_CannotListTwice() public {
        vm.startPrank(player1);
        lobby.listGame{value: 0.1 ether}(0.1 ether);
        vm.expectRevert(ChessLobby.AlreadyListed.selector);
        lobby.listGame{value: 0.2 ether}(0.2 ether);
        vm.stopPrank();
    }

    function test_JoinGame() public {
        vm.prank(player1);
        lobby.listGame{value: 0.1 ether}(0.1 ether);

        vm.prank(player2);
        lobby.joinGame{value: 0.1 ether}(0);

        (uint256[] memory ids,) = lobby.getOpenGames();
        assertEq(ids.length, 0);

        (,,, ChineseChess.GameStatus status,,,) = chess.getGame(0);
        assertEq(uint256(status), uint256(ChineseChess.GameStatus.Active));
    }

    function test_CannotJoinOwnGame() public {
        vm.prank(player1);
        lobby.listGame{value: 0.1 ether}(0.1 ether);

        vm.prank(player1);
        vm.expectRevert(ChessLobby.CannotJoinOwnGame.selector);
        lobby.joinGame{value: 0.1 ether}(0);
    }

    function test_JoinGameWrongWager() public {
        vm.prank(player1);
        lobby.listGame{value: 0.1 ether}(0.1 ether);

        vm.prank(player2);
        vm.expectRevert(ChessLobby.WrongWagerAmount.selector);
        lobby.joinGame{value: 0.05 ether}(0);
    }

    function test_CancelGame() public {
        vm.prank(player1);
        lobby.listGame{value: 0.1 ether}(0.1 ether);

        uint256 balanceBefore = player1.balance;

        vm.prank(player1);
        lobby.cancelGame(0);

        assertEq(player1.balance, balanceBefore + 0.1 ether);

        (uint256[] memory ids,) = lobby.getOpenGames();
        assertEq(ids.length, 0);
    }

    function test_CancelGameOnlyLister() public {
        vm.prank(player1);
        lobby.listGame{value: 0.1 ether}(0.1 ether);

        vm.prank(player2);
        vm.expectRevert(ChessLobby.NotYourListing.selector);
        lobby.cancelGame(0);
    }

    function test_GetOpenGamesFiltersInactive() public {
        vm.prank(player1);
        lobby.listGame{value: 0.1 ether}(0.1 ether);

        vm.prank(player2);
        lobby.listGame{value: 0.2 ether}(0.2 ether);

        vm.prank(player1);
        lobby.cancelGame(0);

        (uint256[] memory ids, ChessLobby.OpenGame[] memory games) = lobby.getOpenGames();
        assertEq(ids.length, 1);
        assertEq(games[0].player, player2);
        assertEq(games[0].wager, 0.2 ether);
    }
}
