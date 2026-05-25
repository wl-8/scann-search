<template>
	<a-form
		:model="state"
		:rules="rules"
		ref="formRef"
		layout="vertical"
		class="search-form"
		@submit.prevent
	>
		<a-form-item label="输入类型" name="queryType">
			<a-radio-group v-model:value="state.queryType">
				<a-radio value="id">细胞ID</a-radio>
				<a-radio value="vector">向量</a-radio>
			</a-radio-group>
		</a-form-item>

		<a-form-item :label="state.queryType === 'id' ? '细胞ID' : '向量（逗号分隔）'" :name="'query'">
			<template v-if="state.queryType === 'id'">
				<a-input v-model:value="state.query" placeholder="例如: cell_12345" />
			</template>
			<template v-else>
				<a-input-textarea v-model:value="state.query" rows="4" placeholder="例如: 0.12, -0.03, ..." />
			</template>
		</a-form-item>

		<a-form-item label="索引与度量">
			<div style="display:flex; gap:8px">
				<a-select v-model:value="state.indexType" style="width:160px">
					<a-select-option value="HNSW">HNSW</a-select-option>
					<a-select-option value="IVF">IVF</a-select-option>
					<a-select-option value="PQ">PQ</a-select-option>
					<a-select-option value="IVF+PQ">IVF+PQ</a-select-option>
					<a-select-option value="IVF+HNSW">IVF+HNSW</a-select-option>
				</a-select>

				<a-select v-model:value="state.metric" style="width:160px">
					<a-select-option value="cosine">cosine</a-select-option>
					<a-select-option value="euclidean">euclidean</a-select-option>
					<a-select-option value="inner_product">inner_product</a-select-option>
				</a-select>
			</div>
		</a-form-item>

		<a-form-item label="Top-K" name="k">
			<a-input-number v-model:value="state.k" :min="1" :max="100" />
		</a-form-item>

		<a-form-item label="过滤：细胞类型" name="filters.cell_type">
			<a-input v-model:value="state.filters.cell_type" placeholder="例如: T-cell" />
		</a-form-item>

		<a-form-item>
			<div style="display:flex; justify-content:flex-end">
				<a-button type="primary" @click="handleSubmit">开始检索</a-button>
			</div>
		</a-form-item>
	</a-form>
</template>

<script setup lang="ts">
import { reactive, toRefs, ref, watch } from "vue"
import { message } from "ant-design-vue"

const props = defineProps({
	modelValue: {
		type: Object as () => any,
		default: () => ({
			queryType: "id",
			query: "",
			indexType: "HNSW",
			metric: "cosine",
			k: 10,
			filters: { cell_type: "" },
		}),
	},
})

const emit = defineEmits<[ (e: string, payload?: any) => void, (e: 'update:modelValue', v: any) => void ]>([
	"submit",
	"update:modelValue",
])

const state = reactive({ ...props.modelValue })
const formRef = ref()

const rules = {
	query: [
		{
			required: true,
			message: "请输入查询内容",
			validator: (_: any, value: any) => {
				if (!value || String(value).trim() === "") return Promise.reject(new Error("请输入查询内容"))
				return Promise.resolve()
			},
		},
	],
	k: [
		{ required: true, message: "请设置 Top-K" },
		{
			validator: (_: any, value: any) => {
				if (!Number.isInteger(value) || value < 1) return Promise.reject(new Error("Top-K 必须是正整数"))
				return Promise.resolve()
			},
		},
	],
}

watch(
	() => props.modelValue,
	(v) => {
		Object.assign(state, v)
	},
	{ deep: true }
)

watch(
	state,
	(v) => emit("update:modelValue", { ...v }),
	{ deep: true }
)

async function handleSubmit() {
	try {
		await formRef.value.validate()
		emit("submit", { ...state })
	} catch (err) {
		message.error("表单校验未通过，请检查输入")
	}
}

const { queryType, query, indexType, metric, k, filters } = toRefs(state)
</script>

<style scoped>
.search-form { padding: 12px; border: 1px solid #eee; border-radius: 6px; }
</style>
