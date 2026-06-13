// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SyncraAuditTrail
 * @dev Immutable audit layer for Syncra ERP inventory traceability
 * Used ONLY for audit logs, stock verification, and procurement/manufacturing proof
 */
contract SyncraAuditTrail {
    struct AuditRecord {
        bytes32 id;
        string eventType;
        string entityType;
        string entityId;
        string dataHash;
        address recorder;
        uint256 timestamp;
        bool verified;
    }

    mapping(bytes32 => AuditRecord) public records;
    bytes32[] public recordIds;
    
    uint256 public totalRecords;
    address public owner;

    event AuditRecorded(
        bytes32 indexed recordId,
        string eventType,
        string entityType,
        string entityId,
        string dataHash,
        address recorder,
        uint256 timestamp
    );

    event RecordVerified(bytes32 indexed recordId, bool verified);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function recordAudit(
        string calldata eventType,
        string calldata entityType,
        string calldata entityId,
        string calldata dataHash
    ) external returns (bytes32) {
        bytes32 recordId = keccak256(
            abi.encodePacked(eventType, entityType, entityId, dataHash, block.timestamp, msg.sender)
        );

        records[recordId] = AuditRecord({
            id: recordId,
            eventType: eventType,
            entityType: entityType,
            entityId: entityId,
            dataHash: dataHash,
            recorder: msg.sender,
            timestamp: block.timestamp,
            verified: true
        });

        recordIds.push(recordId);
        totalRecords++;

        emit AuditRecorded(recordId, eventType, entityType, entityId, dataHash, msg.sender, block.timestamp);

        return recordId;
    }

    function verifyRecord(bytes32 recordId) external view returns (bool) {
        return records[recordId].verified && records[recordId].timestamp > 0;
    }

    function getRecord(bytes32 recordId) external view returns (AuditRecord memory) {
        return records[recordId];
    }

    function getRecordCount() external view returns (uint256) {
        return recordIds.length;
    }

    function getRecentRecords(uint256 count) external view returns (AuditRecord[] memory) {
        uint256 length = count > recordIds.length ? recordIds.length : count;
        AuditRecord[] memory recent = new AuditRecord[](length);
        
        for (uint256 i = 0; i < length; i++) {
            recent[i] = records[recordIds[recordIds.length - 1 - i]];
        }
        
        return recent;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
}
