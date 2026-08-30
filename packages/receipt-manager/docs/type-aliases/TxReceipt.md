[**@tevm/receipt-manager**](../README.md)

***

[@tevm/receipt-manager](../globals.md) / TxReceipt

# Type Alias: TxReceipt

> **TxReceipt** = [`PreByzantiumTxReceipt`](../interfaces/PreByzantiumTxReceipt.md) \| [`PostByzantiumTxReceipt`](../interfaces/PostByzantiumTxReceipt.md) \| [`EIP4844BlobTxReceipt`](../interfaces/EIP4844BlobTxReceipt.md)

Defined in: [packages/receipt-manager/src/ReceiptManager.ts:94](https://github.com/evmts/tevm/blob/main/packages/receipt-manager/src/ReceiptManager.ts#L94)

Union type of all transaction receipt types
Can be pre-Byzantium, post-Byzantium, or EIP-4844 blob receipt
