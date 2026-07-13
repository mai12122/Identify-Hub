// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IdentityRegistry
 * @dev Decentralized Identity (DID) system for issuing, managing, and verifying credentials.
 */
contract IdentityRegistry {
    struct Profile {
        string name;
        string email;
        string metadataURI; // IPFS hash or DID document URL
        uint256 createdAt;
        bool exists;
    }

    struct Credential {
        uint256 id;
        address subject;
        address issuer;
        string credentialType; // e.g., "Degree", "KYC", "Employment"
        string dataHash;       // Cryptographic hash of the credential data
        uint256 issueDate;
        uint256 expiryDate;
        bool isRevoked;
        bool exists;
    }

    // Mappings
    mapping(address => Profile) public profiles;
    mapping(uint256 => Credential) public credentials;
    mapping(address => bool) public authorizedIssuers;
    
    uint256 public credentialCount;
    address public admin;

    // Events
    event ProfileUpdated(address indexed user, string name, string email, string metadataURI);
    event CredentialIssued(uint256 indexed id, address indexed subject, address indexed issuer, string credentialType);
    event CredentialRevoked(uint256 indexed id, address indexed issuer);
    event IssuerAuthorized(address indexed issuer, bool status);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyIssuer() {
        require(authorizedIssuers[msg.sender] || msg.sender == admin, "Not an authorized issuer");
        _;
    }

    constructor() {
        admin = msg.sender;
        authorizedIssuers[msg.sender] = true; // Admin is issuer by default
    }

    function authorizeIssuer(address issuer, bool status) external onlyAdmin {
        authorizedIssuers[issuer] = status;
        emit IssuerAuthorized(issuer, status);
    }

    function createOrUpdateProfile(
        string calldata name,
        string calldata email,
        string calldata metadataURI
    ) external {
        profiles[msg.sender] = Profile({
            name: name,
            email: email,
            metadataURI: metadataURI,
            createdAt: block.timestamp,
            exists: true
        });
        emit ProfileUpdated(msg.sender, name, email, metadataURI);
    }

    function issueCredential(
        address subject,
        string calldata credentialType,
        string calldata dataHash,
        uint256 expiryDate
    ) external onlyIssuer returns (uint256) {
        require(subject != address(0), "Invalid subject address");
        
        credentialCount++;
        credentials[credentialCount] = Credential({
            id: credentialCount,
            subject: subject,
            issuer: msg.sender,
            credentialType: credentialType,
            dataHash: dataHash,
            issueDate: block.timestamp,
            expiryDate: expiryDate,
            isRevoked: false,
            exists: true
        });

        emit CredentialIssued(credentialCount, subject, msg.sender, credentialType);
        return credentialCount;
    }

    function revokeCredential(uint256 id) external {
        require(credentials[id].exists, "Credential does not exist");
        require(credentials[id].issuer == msg.sender || msg.sender == admin, "Only issuer or admin can revoke");
        require(!credentials[id].isRevoked, "Already revoked");

        credentials[id].isRevoked = true;
        emit CredentialRevoked(id, msg.sender);
    }

    function verifyCredential(uint256 id) external view returns (
        bool isValid,
        address subject,
        address issuer,
        string memory credentialType,
        string memory dataHash,
        uint256 expiryDate,
        bool isRevoked
    ) {
        Credential memory cred = credentials[id];
        if (!cred.exists) {
            return (false, address(0), address(0), "", "", 0, false);
        }

        bool expired = cred.expiryDate > 0 && block.timestamp > cred.expiryDate;
        isValid = !cred.isRevoked && !expired;

        return (
            isValid,
            cred.subject,
            cred.issuer,
            cred.credentialType,
            cred.dataHash,
            cred.expiryDate,
            cred.isRevoked
        );
    }

    function getProfile(address user) external view returns (
        string memory name,
        string memory email,
        string memory metadataURI,
        uint256 createdAt,
        bool exists
    ) {
        Profile memory p = profiles[user];
        return (p.name, p.email, p.metadataURI, p.createdAt, p.exists);
    }
}
