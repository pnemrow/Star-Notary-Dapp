const StarNotary = artifacts.require("StarNotary");

var accounts;
var owner;

contract('StarNotary', (accs) => {
    accounts = accs;
    owner = accounts[0];
});

it('can Create a Star', async () => {
    let tokenId = 1;
    let instance = await StarNotary.deployed();
    await instance.createStar('Awesome Star!', tokenId, { from: accounts[0] })
    assert.equal(await instance.tokenIdToStarInfo.call(tokenId), 'Awesome Star!')
}).timeout(10000);

it('lets user1 put up their star for sale', async () => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let starId = 2;
    let starPrice = web3.utils.toWei(".01", "ether");
    await instance.createStar('awesome star', starId, { from: user1 });
    await instance.putStarUpForSale(starId, starPrice, { from: user1 });
    let assertion = await instance.starsForSale.call(starId)
    assert.equal(assertion, starPrice);
}).timeout(10000);

it('lets user1 get the funds after the sale', async () => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 3;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, { from: user1 });
    await instance.putStarUpForSale(starId, starPrice, { from: user1 });
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user1);
    await instance.buyStar(starId, { from: user2, value: balance });
    let balanceOfUser1AfterTransaction = await web3.eth.getBalance(user1);
    let value1 = Number(balanceOfUser1BeforeTransaction) + Number(starPrice);
    let value2 = Number(balanceOfUser1AfterTransaction);
    assert.equal(value1, value2);
}).timeout(10000);

it('lets user2 buy a star, if it is put up for sale', async () => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 4;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, { from: user1 });
    await instance.putStarUpForSale(starId, starPrice, { from: user1 });
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
    await instance.buyStar(starId, { from: user2, value: balance });
    assert.equal(await instance.ownerOf.call(starId), user2);
}).timeout(10000);

it('lets user2 buy a star and decreases its balance in ether', async () => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 5;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, { from: user1 });
    await instance.putStarUpForSale(starId, starPrice, { from: user1 });
    const balanceOfUser2BeforeTransaction = web3.utils.toBN(await web3.eth.getBalance(user2));
    const txInfo = await instance.buyStar(starId, { from: user2, value: balance });
    const balanceAfterUser2BuysStar = web3.utils.toBN(await web3.eth.getBalance(user2));

    // calculate the gas fee
    const tx = await web3.eth.getTransaction(txInfo.tx);
    const gasPrice = web3.utils.toBN(tx.gasPrice);
    const gasUsed = web3.utils.toBN(txInfo.receipt.gasUsed);
    const txGasCost = gasPrice.mul(gasUsed);

    // make sure that [final_balance == initial_balance - star_price - gas_fee]
    const starPriceBN = web3.utils.toBN(starPrice); // from string
    const expectedFinalBalance = balanceOfUser2BeforeTransaction.sub(starPriceBN).sub(txGasCost);
    assert.equal(expectedFinalBalance.toString(), balanceAfterUser2BuysStar.toString());
}).timeout(10000);

// Implement Task 2 Add supporting unit tests

it('can add the star name and star symbol properly', async () => {
    // 1. create a Star with different tokenId
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let starId = 6;
    await instance.createStar('new star', starId, { from: user1 });

    //2. Call the name and symbol properties in your Smart Contract and compare with the name and symbol provided
    let name = await instance.name();
    let symbol = await instance.symbol();
    assert.equal(name, "Star Notary Token");
    assert.equal(symbol, "SNT");
}).timeout(10000);

it('lets 2 users exchange stars', async () => {
    // 1. create 2 Stars with different tokenId
    let instance = await StarNotary.deployed();

    let user1 = accounts[1];
    let star1Id = 7;
    await instance.createStar('star1', star1Id, { from: user1 });

    let user2 = accounts[2];
    let star2Id = 8;
    await instance.createStar('star2', star2Id, { from: user2 });

    // 2. Call the exchangeStars functions implemented in the Smart Contract
    await instance.exchangeStars(star1Id, star2Id, { from: user1 })

    // // 3. Verify that the owners changed
    let newStar1Owner = await instance.ownerOf.call(star1Id);
    let newStar2Owner = await instance.ownerOf.call(star2Id);
    assert.equal(newStar1Owner, user2);
    assert.equal(newStar2Owner, user1);

}).timeout(10000);

it('lets a user transfer a star', async () => {
    // 1. create a Star with different tokenId
    let instance = await StarNotary.deployed();

    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 9;
    await instance.createStar('star for transfer', starId, { from: user1 });

    // 2. use the transferStar function implemented in the Smart Contract
    await instance.transferStar(user2, starId, { from: user1 });
    // 3. Verify the star owner changed.
    let newStarOwner = await instance.ownerOf.call(starId);
    assert.equal(newStarOwner, user2);
}).timeout(10000);

it('lookUptokenIdToStarInfo test', async () => {
    // 1. create a Star with different tokenId
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let starId = 10;
    let newStarName = "hoot";
    await instance.createStar(newStarName, starId, { from: user1 });

    // 2. Call your method lookUptokenIdToStarInfo
    let retrievedStarName = await instance.lookUptokenIdToStarInfo(starId)

    // 3. Verify if you Star name is the same
    assert.equal(newStarName, retrievedStarName);
}).timeout(10000);