// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Soulbound ERC-721 membership pass. Max 10,000. One per wallet. Non-transferable.
contract ChessPass is ERC721, Ownable {
    uint256 public constant MAX_SUPPLY = 10_000;
    uint256 public constant MINT_PRICE = 0.01 ether;

    uint256 public totalMinted;
    string private _baseTokenURI;

    error MaxSupplyReached();
    error AlreadyHasPass();
    error InsufficientPayment();
    error WithdrawFailed();
    error Soulbound();

    constructor() ERC721("ChessPass", "CPASS") Ownable(msg.sender) {}

    /// @notice Mint one pass. Costs 0.01 ETH. Max one per wallet.
    function mint() external payable {
        if (totalMinted >= MAX_SUPPLY) revert MaxSupplyReached();
        if (balanceOf(msg.sender) > 0) revert AlreadyHasPass();
        if (msg.value < MINT_PRICE) revert InsufficientPayment();

        totalMinted++;
        _safeMint(msg.sender, totalMinted); // token IDs: 1 → 10,000
    }

    /// @notice Returns true if the address holds a pass.
    function hasPass(address player) external view returns (bool) {
        return balanceOf(player) > 0;
    }

    /// @notice Returns how many passes are still available to mint.
    function remainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalMinted;
    }

    /// @notice Owner sets the metadata base URI (e.g. ipfs://CID/).
    function setBaseURI(string calldata uri) external onlyOwner {
        _baseTokenURI = uri;
    }

    /// @notice Owner withdraws accumulated ETH from mints.
    function withdraw() external onlyOwner {
        (bool ok,) = owner().call{value: address(this).balance}("");
        if (!ok) revert WithdrawFailed();
    }

    // ─── Soulbound ───────────────────────────────────────────────────────────

    /// @dev Block all transfers and burns. Only minting (from == address(0)) is allowed.
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        if (_ownerOf(tokenId) != address(0)) revert Soulbound();
        return super._update(to, tokenId, auth);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
}
