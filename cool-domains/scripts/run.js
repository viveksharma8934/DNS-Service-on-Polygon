const main = async () => {
    const [owner,randomPerson] = await hre.ethers.getSigners();
    const domainContractFactory = await hre.ethers.getContractFactory("Domains");
    const domainContract = await domainContractFactory.deploy("ninja");
    await domainContract.deployed();
    console.log("Domain Contract deployed to:", domainContract.address);
    console.log("Contract Deployed by:" , owner.address);

    // const txn = await domainContract.register("doom");
    // await txn.wait();

    // const domainOwner  =  await domainContract.getAddress("doom");
    // console.log("Domain Owner is:", domainOwner);

    // txn = await domainContract.connect(randomPerson).setRecord("doom","My domain is cool!");
    // await txn.wait();

    let txn = await domainContract.register("doom", {value: hre.ethers.utils.parseEther("1234")});
    await txn.wait();

    const balance = await hre.ethers.provider.getBalance(domainContract.address);
    console.log("Contract balance:", hre.ethers.utils.formatEther(balance));

    try{
        txn = await domainContract.connect(randomPerson).withdraw();
        await txn.wait();
    } catch (error) {
        console.log("Could not rob contract");
    }

    let ownerBalance = await hre.ethers.provider.getBalance(owner.address);
    console.log("Balance of Owner before withdrawl:",hre.ethers.utils.formatEther(ownerBalance));

    txn = await domainContract.connect(owner).withdraw();
    await txn.wait();

    const contractBalance = await hre.ethers.provider.getBalance(domainContract.address);
    ownerBalance = await hre.ethers.provider.getBalance(owner.address);

    console.log("Balance of Owner after withdrawl:",hre.ethers.utils.formatEther(ownerBalance));
    console.log("Contract balance after withdrawl:", hre.ethers.utils.formatEther(contractBalance));
}

const runMain = async () => {
    try {
        await main();
        process.exit(0);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

runMain();