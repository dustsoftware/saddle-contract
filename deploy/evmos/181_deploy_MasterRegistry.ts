import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import { MasterRegistry } from "../../build/typechain"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, getChainId, ethers } = hre
  const { deploy, get, getOrNull, execute, read } = deployments
  const { deployer } = await getNamedAccounts()

  const masterRegistry = await getOrNull("MasterRegistry")

  if (masterRegistry == null) {
    await deploy("MasterRegistry", {
      from: deployer,
      log: true,
      skipIfAlreadyDeployed: true,
      args: [deployer], // Use deployer address as gnosis safe is not working on evmos
    })

    const contract = (await ethers.getContract(
      "MasterRegistry",
    )) as MasterRegistry

    const batchCall = [
      await contract.populateTransaction.addRegistry(
        ethers.utils.formatBytes32String("PoolRegistry"),
        (
          await get("PoolRegistry")
        ).address,
      ),
    ]

    const batchCallData = batchCall
      .map((x) => x.data)
      .filter((x): x is string => !!x)

    await execute(
      "MasterRegistry",
      { from: deployer, log: true },
      "batch",
      batchCallData,
      true,
    )
  }
}
export default func
func.tags = ["MasterRegistry"]
