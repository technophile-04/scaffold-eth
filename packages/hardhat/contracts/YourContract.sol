pragma solidity >=0.8.0 <0.9.0;
//SPDX-License-Identifier: MIT

import "hardhat/console.sol";

// import "@openzeppelin/contracts/access/Ownable.sol";
// https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol

contract YourContract {
    event SetPurpose(address sender, string purpose);
    event ReturnFirst(address sender, string[] array);

    string public purpose = "Building Unstoppable Apps!!!";
    string[] public myArray;
    uint public num;

    constructor() payable {
        // what should we do on deploy?
        myArray = ["Lorem", "ipsum", "dolor", "sit"];
        num = 2;
    }

    function setPurpose(string memory newPurpose) public {
        purpose = newPurpose;
        console.log(msg.sender, "set purpose to", purpose);
        emit SetPurpose(msg.sender, purpose);
    }

    function returnFirst() public payable returns (string[] memory) {
        require(msg.value >= 0.001 ether, "Incorrect amount");
        string[] memory arr = new string[](num);
        for (uint i = 0; i < num; i++) {
            arr[i] = myArray[i];
        }
        emit ReturnFirst(msg.sender, arr);
        return (arr);
    }

    // to support receiving ETH by default
    receive() external payable {}

    fallback() external payable {}
}
