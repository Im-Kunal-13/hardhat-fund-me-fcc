const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", function () {
      let fundMe
      let mockV3Aggregator
      let deployer
      const sendValue = ethers.utils.parseEther("1")

      beforeEach(async function () {
        // deploy fund me contract using hardhat deploy
        // using hardhat-deploy
        // const accounts = await ethers.getSigners()
        // const accountZero = accounts[0]
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
        fundMe = await ethers.getContract("FundMe", deployer)
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        )
      })

      describe("constructor", function () {
        it("sets the aggregator addresses correctly", async () => {
          const response = await fundMe.getPriceFeed()
          console.log(response, mockV3Aggregator.address)
          // assert.equal(response, mockV3Aggregator.address)
        })
      })

      describe("fund", () => {
        it("fails if you don't send enough ETH", async () => {
          await expect(fundMe.fund()).to.be.revertedWith(
            "You need to spend more ETH!"
          )
        })
        it("Updates the amount funded data structure", async () => {
          await fundMe.fund({ value: sendValue })
          const response = await fundMe.getAddressToAmountFunded(deployer)
          assert.equal(response.toString(), sendValue.toString())
        })
        it("Adds funder to array of getFunder", async () => {
          await fundMe.fund({ value: sendValue })
          const funder = await fundMe.getFunder(0)
          assert.equal(funder, deployer)
        })
      })

      describe("withdraw", () => {
        beforeEach(async () => {
          await fundMe.fund({ value: sendValue })

          it("Withdraw ETH from a single funder", async () => {
            // Arrange
            const startingFundMeBalance = await fundMe.provider.getBalance(
              fundMe.address
            )
            const startingDeployerBalance = await fundMe.provider.getBalance(
              deployer
            )
            // Act
            const transactionResponse = await fundMe.withDraw()
            const transactionReceipt = await transactionResponse.wait(1)
            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)
            // gasCost
            // Assert
            const endingFundMeBalance = await fundMe.provider.getBalance(
              fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
              deployer
            )
            assert.equal(endingFundMeBalance, 0)
            assert.equal(
              startingFundMeBalance.add(startingDeployerBalance),
              endingDeployerBalance.add(gasCost).toString()
            )
          })

          it("Cheaper Withdraw ETH from a single funder", async () => {
            // Arrange
            const startingFundMeBalance = await fundMe.provider.getBalance(
              fundMe.address
            )
            const startingDeployerBalance = await fundMe.provider.getBalance(
              deployer
            )
            // Act s
            const transactionResponse = await fundMe.cheaperWithdraw()
            const transactionReceipt = await transactionResponse.wait(1)
            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)
            // gasCost
            // Assert
            const endingFundMeBalance = await fundMe.provider.getBalance(
              fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
              deployer
            )
            assert.equal(endingFundMeBalance, 0)
            assert.equal(
              startingFundMeBalance.add(startingDeployerBalance),
              endingDeployerBalance.add(gasCost).toString()
            )
          })

          it("allows us to withdraw with multiple getFunder", async () => {
            // Arrange
            const accounts = await ethers.getSigners()

            for (let i = 1; i < 6; i++) {
              const fundmeConnectedContract = await fundme.connect(accounts[i])
              fundmeConnectedContract.fund({ value: sendValue })
            }

            const startingFundMeBalance = await fundMe.provider.getBalance(
              fundMe.address
            )
            const startingDeployerBalance = await fundMe.provider.getBalance(
              deployer
            )

            // Act
            const transactionResponse = await fundme.withDraw()
            const transactionReceipt = await transactionResponse.wait(1)
            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)

            // Assert
            const endingFundMeBalance = await fundMe.provider.getBalance(
              fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
              deployer
            )
            assert.equal(endingFundMeBalance, 0)
            assert.equal(
              startingFundMeBalance.add(startingDeployerBalance),
              endingDeployerBalance.add(gasCost).toString()
            )

            // make sure that the getFunder are reset properly
            await expect(fundMe.getFunder(0)).to.be.reverted

            for (i = 1; i < 6; i++) {
              assert.equal(
                await fundMe.getAddressToAmountFunded(accounts[i].address),
                0
              )
            }
          })

          it("Only allows the owner to withdraw", async () => {
            const accounts = await ethers.getSigners()
            const fundmeConnectedContract = await fundMe.connect(accounts[1])
            await expect(fundmeConnectedContract.withDraw()).to.be.revertedWith(
              "FundMe__NotOwner"
            )
          })

          it("cheaperWithdraw testing...", async () => {
            // Arrange
            const accounts = await ethers.getSigners()

            for (let i = 1; i < 6; i++) {
              const fundmeConnectedContract = await fundme.connect(accounts[i])
              fundmeConnectedContract.fund({ value: sendValue })
            }

            const startingFundMeBalance = await fundMe.provider.getBalance(
              fundMe.address
            )
            const startingDeployerBalance = await fundMe.provider.getBalance(
              deployer
            )

            // Act
            const transactionResponse = await fundme.cheaperWithdraw()
            const transactionReceipt = await transactionResponse.wait(1)
            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)

            // Assert
            const endingFundMeBalance = await fundMe.provider.getBalance(
              fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
              deployer
            )
            assert.equal(endingFundMeBalance, 0)
            assert.equal(
              startingFundMeBalance.add(startingDeployerBalance),
              endingDeployerBalance.add(gasCost).toString()
            )

            // make sure that the getFunder are reset properly
            await expect(fundMe.getFunder(0)).to.be.reverted

            for (i = 1; i < 6; i++) {
              assert.equal(
                await fundMe.getAddressToAmountFunded(accounts[i].address),
                0
              )
            }
          })
        })
      })
    })
