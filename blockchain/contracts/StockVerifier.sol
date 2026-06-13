// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract StockVerifier {
    struct StockEntry {
        string moveReference;
        string productCode;
        string fromLocation;
        string toLocation;
        uint256 quantity;        // quantity * 1000 to avoid decimals
        string uom;
        string dataHash;
        address recordedBy;
        uint256 timestamp;
        string moveType;         // sale/purchase/manufacturing/adjustment
    }

    uint256 private _entryCount;
    mapping(uint256 => StockEntry) public entries;
    mapping(string => uint256[]) public productHistory;  // productCode → entry ids
    mapping(address => bool) public authorizedWriters;
    address public owner;

    event StockMoveRecorded(uint256 id, string productCode, uint256 quantity, string moveType, uint256 timestamp);
    event WriterAuthorized(address writer, bool status);

    modifier onlyOwner() { require(msg.sender == owner, "Not owner"); _; }
    modifier onlyWriter() { require(authorizedWriters[msg.sender] || msg.sender == owner, "Not authorized"); _; }

    constructor() { owner = msg.sender; authorizedWriters[msg.sender] = true; }

    function recordStockMove(
        string memory _moveReference,
        string memory _productCode,
        string memory _fromLocation,
        string memory _toLocation,
        uint256 _quantity,
        string memory _uom,
        string memory _dataHash,
        string memory _moveType
    ) external onlyWriter returns (uint256) {
        _entryCount++;
        uint256 newId = _entryCount;
        
        entries[newId] = StockEntry(
            _moveReference,
            _productCode,
            _fromLocation,
            _toLocation,
            _quantity,
            _uom,
            _dataHash,
            msg.sender,
            block.timestamp,
            _moveType
        );
        
        productHistory[_productCode].push(newId);
        
        emit StockMoveRecorded(newId, _productCode, _quantity, _moveType, block.timestamp);
        return newId;
    }

    function authorizeWriter(address _writer, bool _status) external onlyOwner {
        authorizedWriters[_writer] = _status;
        emit WriterAuthorized(_writer, _status);
    }

    function getProductHistory(string memory productCode) external view returns (StockEntry[] memory) {
        uint256[] memory ids = productHistory[productCode];
        StockEntry[] memory history = new StockEntry[](ids.length);
        for(uint i = 0; i < ids.length; i++) {
            history[i] = entries[ids[i]];
        }
        return history;
    }

    function getTotalMovesForProduct(string memory productCode) external view returns (uint256) {
        return productHistory[productCode].length;
    }
}
