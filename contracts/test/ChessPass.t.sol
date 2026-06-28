// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ChessPass.sol";

contract ChessPassTest is Test {
    ChessPass pass;
    address player1 = makeAddr("player1");
    address player2 = makeAddr("player2");

    function setUp() public {
        pass = new ChessPass();
        vm.deal(player1, 1 ether);
        vm.deal(player2, 1 ether);
    }

    function test_MintPass() public {
        vm.prank(player1);
        pass.mint{value: 0.01 ether}();
        assertEq(pass.balanceOf(player1), 1);
        assertEq(pass.totalMinted(), 1);
    }

    function test_TokenIdStartsAtOne() public {
        vm.prank(player1);
        pass.mint{value: 0.01 ether}();
        assertEq(pass.ownerOf(1), player1); // first token ID is 1
    }

    function test_TokenIdsIncrement() public {
        vm.prank(player1);
        pass.mint{value: 0.01 ether}();
        vm.prank(player2);
        pass.mint{value: 0.01 ether}();
        assertEq(pass.ownerOf(1), player1);
        assertEq(pass.ownerOf(2), player2);
    }

    function test_CannotMintTwice() public {
        vm.startPrank(player1);
        pass.mint{value: 0.01 ether}();
        vm.expectRevert(ChessPass.AlreadyHasPass.selector);
        pass.mint{value: 0.01 ether}();
        vm.stopPrank();
    }

    function test_CannotMintWithoutPayment() public {
        vm.prank(player1);
        vm.expectRevert(ChessPass.InsufficientPayment.selector);
        pass.mint{value: 0}();
    }

    function test_Soulbound_TransferReverts() public {
        vm.startPrank(player1);
        pass.mint{value: 0.01 ether}();
        vm.expectRevert(ChessPass.Soulbound.selector);
        pass.transferFrom(player1, player2, 1);
        vm.stopPrank();
    }

    function test_Soulbound_SafeTransferReverts() public {
        vm.startPrank(player1);
        pass.mint{value: 0.01 ether}();
        vm.expectRevert(ChessPass.Soulbound.selector);
        pass.safeTransferFrom(player1, player2, 1);
        vm.stopPrank();
    }

    function test_HasPass() public {
        assertFalse(pass.hasPass(player1));
        vm.prank(player1);
        pass.mint{value: 0.01 ether}();
        assertTrue(pass.hasPass(player1));
        assertFalse(pass.hasPass(player2)); // other player still has no pass
    }

    function test_RemainingSupply() public {
        assertEq(pass.remainingSupply(), 10_000);
        vm.prank(player1);
        pass.mint{value: 0.01 ether}();
        assertEq(pass.remainingSupply(), 9_999);
    }

    function test_MaxSupplyReached() public {
        // Mint all 10,000 passes from different wallets
        for (uint256 i = 1; i <= 10_000; i++) {
            address wallet = address(uint160(i));
            vm.deal(wallet, 0.01 ether);
            vm.prank(wallet);
            pass.mint{value: 0.01 ether}();
        }
        assertEq(pass.totalMinted(), 10_000);

        // Next mint must fail
        address extra = makeAddr("extra");
        vm.deal(extra, 0.01 ether);
        vm.prank(extra);
        vm.expectRevert(ChessPass.MaxSupplyReached.selector);
        pass.mint{value: 0.01 ether}();
    }

    function test_WithdrawByOwner() public {
        vm.prank(player1);
        pass.mint{value: 0.01 ether}();
        uint256 before = address(this).balance;
        pass.withdraw();
        assertGt(address(this).balance, before);
    }

    function test_WithdrawOnlyOwner() public {
        vm.prank(player1);
        pass.mint{value: 0.01 ether}();
        vm.prank(player1);
        vm.expectRevert();
        pass.withdraw();
    }

    receive() external payable {}
}
