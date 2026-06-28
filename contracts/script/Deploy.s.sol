// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/ChessPass.sol";
import "../src/ChessLobby.sol";
import "../src/ChineseChess.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        ChessPass chessPass = new ChessPass();
        ChineseChess chineseChess = new ChineseChess();
        ChessLobby chessLobby = new ChessLobby(address(chessPass));

        chessLobby.setChineseChess(address(chineseChess));
        chineseChess.setLobby(address(chessLobby));

        vm.stopBroadcast();

        console.log("ChessPass    :", address(chessPass));
        console.log("ChineseChess :", address(chineseChess));
        console.log("ChessLobby   :", address(chessLobby));
    }
}
