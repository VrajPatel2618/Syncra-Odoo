// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ERPLedger {

    // ── Enums ──
    enum RecordType { STOCK_MOVE, SALES_ORDER, PURCHASE_ORDER, MANUFACTURING_ORDER, DELIVERY, GRN }
    enum Status { CREATED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED }

    // ── Structs ──
    struct ERPRecord {
        uint256 id;
        RecordType recordType;
        string referenceNumber;   // e.g. SO-2024-00001
        string dataHash;          // SHA-256 hash of the full record JSON
        address recordedBy;       // wallet address of the user
        uint256 timestamp;
        Status status;
        string metadata;          // JSON string with key fields
    }

    struct StatusUpdate {
        uint256 recordId;
        Status oldStatus;
        Status newStatus;
        string reason;
        address updatedBy;
        uint256 timestamp;
    }

    // ── State ──
    uint256 private _recordCount;
    mapping(uint256 => ERPRecord) public records;
    mapping(string => uint256) public referenceToId;   // referenceNumber → id
    mapping(uint256 => StatusUpdate[]) public statusHistory;
    mapping(address => bool) public authorizedWriters;
    address public owner;

    // ── Events ──
    event RecordCreated(uint256 indexed id, RecordType recordType, string referenceNumber, string dataHash, uint256 timestamp);
    event StatusUpdated(uint256 indexed recordId, Status oldStatus, Status newStatus, address updatedBy, uint256 timestamp);
    event WriterAuthorized(address writer, bool status);

    // ── Modifiers ──
    modifier onlyOwner() { require(msg.sender == owner, "Not owner"); _; }
    modifier onlyWriter() { require(authorizedWriters[msg.sender] || msg.sender == owner, "Not authorized"); _; }

    constructor() { owner = msg.sender; authorizedWriters[msg.sender] = true; }

    // ── Write Functions ──
    function createRecord(
        RecordType _type,
        string memory _referenceNumber,
        string memory _dataHash,
        string memory _metadata
    ) external onlyWriter returns (uint256) {
        require(referenceToId[_referenceNumber] == 0, "Reference already exists");
        _recordCount++;
        uint256 newId = _recordCount;
        records[newId] = ERPRecord(newId, _type, _referenceNumber, _dataHash, msg.sender, block.timestamp, Status.CREATED, _metadata);
        referenceToId[_referenceNumber] = newId;
        emit RecordCreated(newId, _type, _referenceNumber, _dataHash, block.timestamp);
        return newId;
    }

    function updateStatus(
        uint256 _recordId,
        Status _newStatus,
        string memory _reason
    ) external onlyWriter {
        require(_recordId > 0 && _recordId <= _recordCount, "Invalid record");
        ERPRecord storage record = records[_recordId];
        Status oldStatus = record.status;
        record.status = _newStatus;
        statusHistory[_recordId].push(StatusUpdate(_recordId, oldStatus, _newStatus, _reason, msg.sender, block.timestamp));
        emit StatusUpdated(_recordId, oldStatus, _newStatus, msg.sender, block.timestamp);
    }

    function authorizeWriter(address _writer, bool _status) external onlyOwner {
        authorizedWriters[_writer] = _status;
        emit WriterAuthorized(_writer, _status);
    }

    // ── Read Functions ──
    function getRecord(uint256 _id) external view returns (ERPRecord memory) { return records[_id]; }
    function getRecordByReference(string memory _ref) external view returns (ERPRecord memory) { return records[referenceToId[_ref]]; }
    function getStatusHistory(uint256 _id) external view returns (StatusUpdate[] memory) { return statusHistory[_id]; }
    function getTotalRecords() external view returns (uint256) { return _recordCount; }
    function verifyDataHash(uint256 _id, string memory _hash) external view returns (bool) {
        return keccak256(bytes(records[_id].dataHash)) == keccak256(bytes(_hash));
    }
}
