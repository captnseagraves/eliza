[@ai16z/eliza v0.1.4-alpha.3](../index.md) / GenerationOptions

# Interface: GenerationOptions

Configuration options for generating objects with a model.

## Properties

### runtime

> **runtime**: [`IAgentRuntime`](IAgentRuntime.md)

#### Defined in

[packages/core/src/generation.ts:1053](https://github.com/captnseagraves/eliza/blob/main/packages/core/src/generation.ts#L1053)

***

### context

> **context**: `string`

#### Defined in

[packages/core/src/generation.ts:1054](https://github.com/captnseagraves/eliza/blob/main/packages/core/src/generation.ts#L1054)

***

### modelClass

> **modelClass**: [`ModelClass`](../enumerations/ModelClass.md)

#### Defined in

[packages/core/src/generation.ts:1055](https://github.com/captnseagraves/eliza/blob/main/packages/core/src/generation.ts#L1055)

***

### schema?

> `optional` **schema**: `ZodType`\<`any`, `ZodTypeDef`, `any`\>

#### Defined in

[packages/core/src/generation.ts:1056](https://github.com/captnseagraves/eliza/blob/main/packages/core/src/generation.ts#L1056)

***

### schemaName?

> `optional` **schemaName**: `string`

#### Defined in

[packages/core/src/generation.ts:1057](https://github.com/captnseagraves/eliza/blob/main/packages/core/src/generation.ts#L1057)

***

### schemaDescription?

> `optional` **schemaDescription**: `string`

#### Defined in

[packages/core/src/generation.ts:1058](https://github.com/captnseagraves/eliza/blob/main/packages/core/src/generation.ts#L1058)

***

### stop?

> `optional` **stop**: `string`[]

#### Defined in

[packages/core/src/generation.ts:1059](https://github.com/captnseagraves/eliza/blob/main/packages/core/src/generation.ts#L1059)

***

### mode?

> `optional` **mode**: `"auto"` \| `"json"` \| `"tool"`

#### Defined in

[packages/core/src/generation.ts:1060](https://github.com/captnseagraves/eliza/blob/main/packages/core/src/generation.ts#L1060)

***

### experimental\_providerMetadata?

> `optional` **experimental\_providerMetadata**: `Record`\<`string`, `unknown`\>

#### Defined in

[packages/core/src/generation.ts:1061](https://github.com/captnseagraves/eliza/blob/main/packages/core/src/generation.ts#L1061)
