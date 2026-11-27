declare const _HelloWorld2: {
    readonly abi: readonly [{
        readonly inputs: readonly [];
        readonly name: "greet2";
        readonly outputs: readonly [{
            readonly internalType: "string";
            readonly name: "";
            readonly type: "string";
        }];
        readonly stateMutability: "pure";
        readonly type: "function";
    }];
    readonly bytecode: {
        readonly object: "0x608060405234801561001057600080fd5b5060ea8061001f6000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c806380cc6ac114602d575b600080fd5b604080518082018252600b81527f48656c6c6f20576f726c6400000000000000000000000000000000000000000060208201529051606a91906073565b60405180910390f35b600060208083528351808285015260005b81811015609e578581018301518582016040015282016084565b5060006040828601015260407fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0601f830116850101925050509291505056fea164736f6c6343000811000a";
        readonly sourceMap: "145:120:0:-:0;;;;;;;;;;;;;;;;;;;";
        readonly linkReferences: {};
    };
    readonly deployedBytecode: {
        readonly object: "0x6080604052348015600f57600080fd5b506004361060285760003560e01c806380cc6ac114602d575b600080fd5b604080518082018252600b81527f48656c6c6f20576f726c6400000000000000000000000000000000000000000060208201529051606a91906073565b60405180910390f35b600060208083528351808285015260005b81811015609e578581018301518582016040015282016084565b5060006040828601015260407fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0601f830116850101925050509291505056fea164736f6c6343000811000a";
        readonly sourceMap: "145:120:0:-:0;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;172:91;236:20;;;;;;;;;;;;;;;;172:91;;;;236:20;172:91;:::i;:::-;;;;;;;;14:607:1;126:4;155:2;184;173:9;166:21;216:6;210:13;259:6;254:2;243:9;239:18;232:34;284:1;294:140;308:6;305:1;302:13;294:140;;;403:14;;;399:23;;393:30;369:17;;;388:2;365:26;358:66;323:10;;294:140;;;298:3;483:1;478:2;469:6;458:9;454:22;450:31;443:42;612:2;542:66;537:2;529:6;525:15;521:88;510:9;506:104;502:113;494:121;;;;14:607;;;;:::o";
        readonly linkReferences: {};
    };
    readonly methodIdentifiers: {
        readonly 'greet2()': "80cc6ac1";
    };
    readonly rawMetadata: "{\"compiler\":{\"version\":\"0.8.17+commit.8df45f5f\"},\"language\":\"Solidity\",\"output\":{\"abi\":[{\"inputs\":[],\"name\":\"greet2\",\"outputs\":[{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"}],\"stateMutability\":\"pure\",\"type\":\"function\"}],\"devdoc\":{\"kind\":\"dev\",\"methods\":{},\"version\":1},\"userdoc\":{\"kind\":\"user\",\"methods\":{},\"version\":1}},\"settings\":{\"compilationTarget\":{\"src/test/fixtures/HelloWorld.sol\":\"HelloWorld2\"},\"evmVersion\":\"london\",\"libraries\":{},\"metadata\":{\"bytecodeHash\":\"none\"},\"optimizer\":{\"enabled\":true,\"runs\":1000000},\"remappings\":[\":@openzeppelin/contracts/=node_modules/@openzeppelin/contracts/\"]},\"sources\":{\"src/test/fixtures/HelloWorld.sol\":{\"keccak256\":\"0x0971286d63af137da3bab48d7f700764d2f2de9adddd5dc3ba0af5cff0eaa697\",\"urls\":[\"bzz-raw://f9583dbd0564251763a7d9dc06da4a2b3e2fae129abba81b9d59abe020186028\",\"dweb:/ipfs/QmRf7maix5pp4iHgfkiKpXzbNr9DjjVoSvuA3efY3mbjds\"]}},\"version\":1}";
    readonly metadata: {
        readonly compiler: {
            readonly version: "0.8.17+commit.8df45f5f";
        };
        readonly language: "Solidity";
        readonly output: {
            readonly abi: readonly [{
                readonly inputs: readonly [];
                readonly stateMutability: "pure";
                readonly type: "function";
                readonly name: "greet2";
                readonly outputs: readonly [{
                    readonly internalType: "string";
                    readonly name: "";
                    readonly type: "string";
                }];
            }];
            readonly devdoc: {
                readonly kind: "dev";
                readonly methods: {};
                readonly version: 1;
            };
            readonly userdoc: {
                readonly kind: "user";
                readonly methods: {};
                readonly version: 1;
            };
        };
        readonly settings: {
            readonly remappings: readonly [":@openzeppelin/contracts/=node_modules/@openzeppelin/contracts/"];
            readonly optimizer: {
                readonly enabled: true;
                readonly runs: 1000000;
            };
            readonly metadata: {
                readonly bytecodeHash: "none";
            };
            readonly compilationTarget: {
                readonly 'src/test/fixtures/HelloWorld.sol': "HelloWorld2";
            };
            readonly libraries: {};
        };
        readonly sources: {
            readonly 'src/test/fixtures/HelloWorld.sol': {
                readonly keccak256: "0x0971286d63af137da3bab48d7f700764d2f2de9adddd5dc3ba0af5cff0eaa697";
                readonly urls: readonly ["bzz-raw://f9583dbd0564251763a7d9dc06da4a2b3e2fae129abba81b9d59abe020186028", "dweb:/ipfs/QmRf7maix5pp4iHgfkiKpXzbNr9DjjVoSvuA3efY3mbjds"];
                readonly license: null;
            };
        };
        readonly version: 1;
    };
    readonly ast: {
        readonly absolutePath: "src/test/fixtures/HelloWorld.sol";
        readonly id: 20;
        readonly exportedSymbols: {
            readonly HelloWorld: readonly [10];
            readonly HelloWorld2: readonly [19];
        };
        readonly nodeType: "SourceUnit";
        readonly src: "0:266:0";
        readonly nodes: readonly [{
            readonly id: 1;
            readonly nodeType: "PragmaDirective";
            readonly src: "0:23:0";
            readonly nodes: readonly [];
            readonly literals: readonly ["solidity", "0.8", ".17"];
        }, {
            readonly id: 10;
            readonly nodeType: "ContractDefinition";
            readonly src: "25:118:0";
            readonly nodes: readonly [{
                readonly id: 9;
                readonly nodeType: "FunctionDefinition";
                readonly src: "51:90:0";
                readonly nodes: readonly [];
                readonly body: {
                    readonly id: 8;
                    readonly nodeType: "Block";
                    readonly src: "104:37:0";
                    readonly nodes: readonly [];
                    readonly statements: readonly [{
                        readonly expression: {
                            readonly hexValue: "48656c6c6f20576f726c64";
                            readonly id: 6;
                            readonly isConstant: false;
                            readonly isLValue: false;
                            readonly isPure: true;
                            readonly kind: "string";
                            readonly lValueRequested: false;
                            readonly nodeType: "Literal";
                            readonly src: "121:13:0";
                            readonly typeDescriptions: {
                                readonly typeIdentifier: "t_stringliteral_592fa743889fc7f92ac2a37bb1f5ba1daf2a5c84741ca0e0061d243a2e6707ba";
                                readonly typeString: "literal_string \"Hello World\"";
                            };
                            readonly value: "Hello World";
                        };
                        readonly functionReturnParameters: 5;
                        readonly id: 7;
                        readonly nodeType: "Return";
                        readonly src: "114:20:0";
                    }];
                };
                readonly functionSelector: "cfae3217";
                readonly implemented: true;
                readonly kind: "function";
                readonly modifiers: readonly [];
                readonly name: "greet";
                readonly nameLocation: "60:5:0";
                readonly parameters: {
                    readonly id: 2;
                    readonly nodeType: "ParameterList";
                    readonly parameters: readonly [];
                    readonly src: "65:2:0";
                };
                readonly returnParameters: {
                    readonly id: 5;
                    readonly nodeType: "ParameterList";
                    readonly parameters: readonly [{
                        readonly constant: false;
                        readonly id: 4;
                        readonly mutability: "mutable";
                        readonly name: "";
                        readonly nameLocation: "-1:-1:-1";
                        readonly nodeType: "VariableDeclaration";
                        readonly scope: 9;
                        readonly src: "89:13:0";
                        readonly stateVariable: false;
                        readonly storageLocation: "memory";
                        readonly typeDescriptions: {
                            readonly typeIdentifier: "t_string_memory_ptr";
                            readonly typeString: "string";
                        };
                        readonly typeName: {
                            readonly id: 3;
                            readonly name: "string";
                            readonly nodeType: "ElementaryTypeName";
                            readonly src: "89:6:0";
                            readonly typeDescriptions: {
                                readonly typeIdentifier: "t_string_storage_ptr";
                                readonly typeString: "string";
                            };
                        };
                        readonly visibility: "internal";
                    }];
                    readonly src: "88:15:0";
                };
                readonly scope: 10;
                readonly stateMutability: "pure";
                readonly virtual: false;
                readonly visibility: "public";
            }];
            readonly abstract: false;
            readonly baseContracts: readonly [];
            readonly canonicalName: "HelloWorld";
            readonly contractDependencies: readonly [];
            readonly contractKind: "contract";
            readonly fullyImplemented: true;
            readonly linearizedBaseContracts: readonly [10];
            readonly name: "HelloWorld";
            readonly nameLocation: "34:10:0";
            readonly scope: 20;
            readonly usedErrors: readonly [];
        }, {
            readonly id: 19;
            readonly nodeType: "ContractDefinition";
            readonly src: "145:120:0";
            readonly nodes: readonly [{
                readonly id: 18;
                readonly nodeType: "FunctionDefinition";
                readonly src: "172:91:0";
                readonly nodes: readonly [];
                readonly body: {
                    readonly id: 17;
                    readonly nodeType: "Block";
                    readonly src: "226:37:0";
                    readonly nodes: readonly [];
                    readonly statements: readonly [{
                        readonly expression: {
                            readonly hexValue: "48656c6c6f20576f726c64";
                            readonly id: 15;
                            readonly isConstant: false;
                            readonly isLValue: false;
                            readonly isPure: true;
                            readonly kind: "string";
                            readonly lValueRequested: false;
                            readonly nodeType: "Literal";
                            readonly src: "243:13:0";
                            readonly typeDescriptions: {
                                readonly typeIdentifier: "t_stringliteral_592fa743889fc7f92ac2a37bb1f5ba1daf2a5c84741ca0e0061d243a2e6707ba";
                                readonly typeString: "literal_string \"Hello World\"";
                            };
                            readonly value: "Hello World";
                        };
                        readonly functionReturnParameters: 14;
                        readonly id: 16;
                        readonly nodeType: "Return";
                        readonly src: "236:20:0";
                    }];
                };
                readonly functionSelector: "80cc6ac1";
                readonly implemented: true;
                readonly kind: "function";
                readonly modifiers: readonly [];
                readonly name: "greet2";
                readonly nameLocation: "181:6:0";
                readonly parameters: {
                    readonly id: 11;
                    readonly nodeType: "ParameterList";
                    readonly parameters: readonly [];
                    readonly src: "187:2:0";
                };
                readonly returnParameters: {
                    readonly id: 14;
                    readonly nodeType: "ParameterList";
                    readonly parameters: readonly [{
                        readonly constant: false;
                        readonly id: 13;
                        readonly mutability: "mutable";
                        readonly name: "";
                        readonly nameLocation: "-1:-1:-1";
                        readonly nodeType: "VariableDeclaration";
                        readonly scope: 18;
                        readonly src: "211:13:0";
                        readonly stateVariable: false;
                        readonly storageLocation: "memory";
                        readonly typeDescriptions: {
                            readonly typeIdentifier: "t_string_memory_ptr";
                            readonly typeString: "string";
                        };
                        readonly typeName: {
                            readonly id: 12;
                            readonly name: "string";
                            readonly nodeType: "ElementaryTypeName";
                            readonly src: "211:6:0";
                            readonly typeDescriptions: {
                                readonly typeIdentifier: "t_string_storage_ptr";
                                readonly typeString: "string";
                            };
                        };
                        readonly visibility: "internal";
                    }];
                    readonly src: "210:15:0";
                };
                readonly scope: 19;
                readonly stateMutability: "pure";
                readonly virtual: false;
                readonly visibility: "public";
            }];
            readonly abstract: false;
            readonly baseContracts: readonly [];
            readonly canonicalName: "HelloWorld2";
            readonly contractDependencies: readonly [];
            readonly contractKind: "contract";
            readonly fullyImplemented: true;
            readonly linearizedBaseContracts: readonly [19];
            readonly name: "HelloWorld2";
            readonly nameLocation: "154:11:0";
            readonly scope: 20;
            readonly usedErrors: readonly [];
        }];
    };
    readonly id: 0;
};
export declare const HelloWorld2: typeof _HelloWorld2;
declare const _HelloWorld: {
    readonly abi: readonly [{
        readonly inputs: readonly [];
        readonly name: "greet";
        readonly outputs: readonly [{
            readonly internalType: "string";
            readonly name: "";
            readonly type: "string";
        }];
        readonly stateMutability: "pure";
        readonly type: "function";
    }];
    readonly bytecode: {
        readonly object: "0x608060405234801561001057600080fd5b5060ea8061001f6000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c8063cfae321714602d575b600080fd5b604080518082018252600b81527f48656c6c6f20576f726c6400000000000000000000000000000000000000000060208201529051606a91906073565b60405180910390f35b600060208083528351808285015260005b81811015609e578581018301518582016040015282016084565b5060006040828601015260407fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0601f830116850101925050509291505056fea164736f6c6343000811000a";
        readonly sourceMap: "25:118:0:-:0;;;;;;;;;;;;;;;;;;;";
        readonly linkReferences: {};
    };
    readonly deployedBytecode: {
        readonly object: "0x6080604052348015600f57600080fd5b506004361060285760003560e01c8063cfae321714602d575b600080fd5b604080518082018252600b81527f48656c6c6f20576f726c6400000000000000000000000000000000000000000060208201529051606a91906073565b60405180910390f35b600060208083528351808285015260005b81811015609e578581018301518582016040015282016084565b5060006040828601015260407fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0601f830116850101925050509291505056fea164736f6c6343000811000a";
        readonly sourceMap: "25:118:0:-:0;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;51:90;114:20;;;;;;;;;;;;;;;;51:90;;;;114:20;51:90;:::i;:::-;;;;;;;;14:607:1;126:4;155:2;184;173:9;166:21;216:6;210:13;259:6;254:2;243:9;239:18;232:34;284:1;294:140;308:6;305:1;302:13;294:140;;;403:14;;;399:23;;393:30;369:17;;;388:2;365:26;358:66;323:10;;294:140;;;298:3;483:1;478:2;469:6;458:9;454:22;450:31;443:42;612:2;542:66;537:2;529:6;525:15;521:88;510:9;506:104;502:113;494:121;;;;14:607;;;;:::o";
        readonly linkReferences: {};
    };
    readonly methodIdentifiers: {
        readonly 'greet()': "cfae3217";
    };
    readonly rawMetadata: "{\"compiler\":{\"version\":\"0.8.17+commit.8df45f5f\"},\"language\":\"Solidity\",\"output\":{\"abi\":[{\"inputs\":[],\"name\":\"greet\",\"outputs\":[{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"}],\"stateMutability\":\"pure\",\"type\":\"function\"}],\"devdoc\":{\"kind\":\"dev\",\"methods\":{},\"version\":1},\"userdoc\":{\"kind\":\"user\",\"methods\":{},\"version\":1}},\"settings\":{\"compilationTarget\":{\"src/test/fixtures/HelloWorld.sol\":\"HelloWorld\"},\"evmVersion\":\"london\",\"libraries\":{},\"metadata\":{\"bytecodeHash\":\"none\"},\"optimizer\":{\"enabled\":true,\"runs\":1000000},\"remappings\":[\":@openzeppelin/contracts/=node_modules/@openzeppelin/contracts/\"]},\"sources\":{\"src/test/fixtures/HelloWorld.sol\":{\"keccak256\":\"0x0971286d63af137da3bab48d7f700764d2f2de9adddd5dc3ba0af5cff0eaa697\",\"urls\":[\"bzz-raw://f9583dbd0564251763a7d9dc06da4a2b3e2fae129abba81b9d59abe020186028\",\"dweb:/ipfs/QmRf7maix5pp4iHgfkiKpXzbNr9DjjVoSvuA3efY3mbjds\"]}},\"version\":1}";
    readonly metadata: {
        readonly compiler: {
            readonly version: "0.8.17+commit.8df45f5f";
        };
        readonly language: "Solidity";
        readonly output: {
            readonly abi: readonly [{
                readonly inputs: readonly [];
                readonly stateMutability: "pure";
                readonly type: "function";
                readonly name: "greet";
                readonly outputs: readonly [{
                    readonly internalType: "string";
                    readonly name: "";
                    readonly type: "string";
                }];
            }];
            readonly devdoc: {
                readonly kind: "dev";
                readonly methods: {};
                readonly version: 1;
            };
            readonly userdoc: {
                readonly kind: "user";
                readonly methods: {};
                readonly version: 1;
            };
        };
        readonly settings: {
            readonly remappings: readonly [":@openzeppelin/contracts/=node_modules/@openzeppelin/contracts/"];
            readonly optimizer: {
                readonly enabled: true;
                readonly runs: 1000000;
            };
            readonly metadata: {
                readonly bytecodeHash: "none";
            };
            readonly compilationTarget: {
                readonly 'src/test/fixtures/HelloWorld.sol': "HelloWorld";
            };
            readonly libraries: {};
        };
        readonly sources: {
            readonly 'src/test/fixtures/HelloWorld.sol': {
                readonly keccak256: "0x0971286d63af137da3bab48d7f700764d2f2de9adddd5dc3ba0af5cff0eaa697";
                readonly urls: readonly ["bzz-raw://f9583dbd0564251763a7d9dc06da4a2b3e2fae129abba81b9d59abe020186028", "dweb:/ipfs/QmRf7maix5pp4iHgfkiKpXzbNr9DjjVoSvuA3efY3mbjds"];
                readonly license: null;
            };
        };
        readonly version: 1;
    };
    readonly ast: {
        readonly absolutePath: "src/test/fixtures/HelloWorld.sol";
        readonly id: 20;
        readonly exportedSymbols: {
            readonly HelloWorld: readonly [10];
            readonly HelloWorld2: readonly [19];
        };
        readonly nodeType: "SourceUnit";
        readonly src: "0:266:0";
        readonly nodes: readonly [{
            readonly id: 1;
            readonly nodeType: "PragmaDirective";
            readonly src: "0:23:0";
            readonly nodes: readonly [];
            readonly literals: readonly ["solidity", "0.8", ".17"];
        }, {
            readonly id: 10;
            readonly nodeType: "ContractDefinition";
            readonly src: "25:118:0";
            readonly nodes: readonly [{
                readonly id: 9;
                readonly nodeType: "FunctionDefinition";
                readonly src: "51:90:0";
                readonly nodes: readonly [];
                readonly body: {
                    readonly id: 8;
                    readonly nodeType: "Block";
                    readonly src: "104:37:0";
                    readonly nodes: readonly [];
                    readonly statements: readonly [{
                        readonly expression: {
                            readonly hexValue: "48656c6c6f20576f726c64";
                            readonly id: 6;
                            readonly isConstant: false;
                            readonly isLValue: false;
                            readonly isPure: true;
                            readonly kind: "string";
                            readonly lValueRequested: false;
                            readonly nodeType: "Literal";
                            readonly src: "121:13:0";
                            readonly typeDescriptions: {
                                readonly typeIdentifier: "t_stringliteral_592fa743889fc7f92ac2a37bb1f5ba1daf2a5c84741ca0e0061d243a2e6707ba";
                                readonly typeString: "literal_string \"Hello World\"";
                            };
                            readonly value: "Hello World";
                        };
                        readonly functionReturnParameters: 5;
                        readonly id: 7;
                        readonly nodeType: "Return";
                        readonly src: "114:20:0";
                    }];
                };
                readonly functionSelector: "cfae3217";
                readonly implemented: true;
                readonly kind: "function";
                readonly modifiers: readonly [];
                readonly name: "greet";
                readonly nameLocation: "60:5:0";
                readonly parameters: {
                    readonly id: 2;
                    readonly nodeType: "ParameterList";
                    readonly parameters: readonly [];
                    readonly src: "65:2:0";
                };
                readonly returnParameters: {
                    readonly id: 5;
                    readonly nodeType: "ParameterList";
                    readonly parameters: readonly [{
                        readonly constant: false;
                        readonly id: 4;
                        readonly mutability: "mutable";
                        readonly name: "";
                        readonly nameLocation: "-1:-1:-1";
                        readonly nodeType: "VariableDeclaration";
                        readonly scope: 9;
                        readonly src: "89:13:0";
                        readonly stateVariable: false;
                        readonly storageLocation: "memory";
                        readonly typeDescriptions: {
                            readonly typeIdentifier: "t_string_memory_ptr";
                            readonly typeString: "string";
                        };
                        readonly typeName: {
                            readonly id: 3;
                            readonly name: "string";
                            readonly nodeType: "ElementaryTypeName";
                            readonly src: "89:6:0";
                            readonly typeDescriptions: {
                                readonly typeIdentifier: "t_string_storage_ptr";
                                readonly typeString: "string";
                            };
                        };
                        readonly visibility: "internal";
                    }];
                    readonly src: "88:15:0";
                };
                readonly scope: 10;
                readonly stateMutability: "pure";
                readonly virtual: false;
                readonly visibility: "public";
            }];
            readonly abstract: false;
            readonly baseContracts: readonly [];
            readonly canonicalName: "HelloWorld";
            readonly contractDependencies: readonly [];
            readonly contractKind: "contract";
            readonly fullyImplemented: true;
            readonly linearizedBaseContracts: readonly [10];
            readonly name: "HelloWorld";
            readonly nameLocation: "34:10:0";
            readonly scope: 20;
            readonly usedErrors: readonly [];
        }, {
            readonly id: 19;
            readonly nodeType: "ContractDefinition";
            readonly src: "145:120:0";
            readonly nodes: readonly [{
                readonly id: 18;
                readonly nodeType: "FunctionDefinition";
                readonly src: "172:91:0";
                readonly nodes: readonly [];
                readonly body: {
                    readonly id: 17;
                    readonly nodeType: "Block";
                    readonly src: "226:37:0";
                    readonly nodes: readonly [];
                    readonly statements: readonly [{
                        readonly expression: {
                            readonly hexValue: "48656c6c6f20576f726c64";
                            readonly id: 15;
                            readonly isConstant: false;
                            readonly isLValue: false;
                            readonly isPure: true;
                            readonly kind: "string";
                            readonly lValueRequested: false;
                            readonly nodeType: "Literal";
                            readonly src: "243:13:0";
                            readonly typeDescriptions: {
                                readonly typeIdentifier: "t_stringliteral_592fa743889fc7f92ac2a37bb1f5ba1daf2a5c84741ca0e0061d243a2e6707ba";
                                readonly typeString: "literal_string \"Hello World\"";
                            };
                            readonly value: "Hello World";
                        };
                        readonly functionReturnParameters: 14;
                        readonly id: 16;
                        readonly nodeType: "Return";
                        readonly src: "236:20:0";
                    }];
                };
                readonly functionSelector: "80cc6ac1";
                readonly implemented: true;
                readonly kind: "function";
                readonly modifiers: readonly [];
                readonly name: "greet2";
                readonly nameLocation: "181:6:0";
                readonly parameters: {
                    readonly id: 11;
                    readonly nodeType: "ParameterList";
                    readonly parameters: readonly [];
                    readonly src: "187:2:0";
                };
                readonly returnParameters: {
                    readonly id: 14;
                    readonly nodeType: "ParameterList";
                    readonly parameters: readonly [{
                        readonly constant: false;
                        readonly id: 13;
                        readonly mutability: "mutable";
                        readonly name: "";
                        readonly nameLocation: "-1:-1:-1";
                        readonly nodeType: "VariableDeclaration";
                        readonly scope: 18;
                        readonly src: "211:13:0";
                        readonly stateVariable: false;
                        readonly storageLocation: "memory";
                        readonly typeDescriptions: {
                            readonly typeIdentifier: "t_string_memory_ptr";
                            readonly typeString: "string";
                        };
                        readonly typeName: {
                            readonly id: 12;
                            readonly name: "string";
                            readonly nodeType: "ElementaryTypeName";
                            readonly src: "211:6:0";
                            readonly typeDescriptions: {
                                readonly typeIdentifier: "t_string_storage_ptr";
                                readonly typeString: "string";
                            };
                        };
                        readonly visibility: "internal";
                    }];
                    readonly src: "210:15:0";
                };
                readonly scope: 19;
                readonly stateMutability: "pure";
                readonly virtual: false;
                readonly visibility: "public";
            }];
            readonly abstract: false;
            readonly baseContracts: readonly [];
            readonly canonicalName: "HelloWorld2";
            readonly contractDependencies: readonly [];
            readonly contractKind: "contract";
            readonly fullyImplemented: true;
            readonly linearizedBaseContracts: readonly [19];
            readonly name: "HelloWorld2";
            readonly nameLocation: "154:11:0";
            readonly scope: 20;
            readonly usedErrors: readonly [];
        }];
    };
    readonly id: 0;
};
export declare const HelloWorld: typeof _HelloWorld;
export {};
