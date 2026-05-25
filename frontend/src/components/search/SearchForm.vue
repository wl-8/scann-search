<template>
	<a-card class="search-card">
		<a-form
			:model="state"
			:rules="rules"
			ref="formRef"
			layout="vertical"
			class="search-form"
			@submit.prevent
		>
			<a-row :gutter="16">
				<a-col :span="24">
					<a-form-item label="输入类型" name="queryType">
						<a-radio-group v-model:value="state.queryType">
							<a-radio value="id">细胞ID</a-radio>
							<a-radio value="vector">向量</a-radio>
						</a-radio-group>
					</a-form-item>
				</a-col>

				<a-col :span="24">
					<a-form-item :label="state.queryType === 'id' ? '细胞ID' : '向量（逗号分隔）'" :name="'query'">
						<template v-if="state.queryType === 'id'">
							<a-input v-model:value="state.query" placeholder="例如: cell_12345" />
						</template>
						<template v-else>
							<a-input-textarea v-model:value="state.query" rows="4" placeholder="例如: 0.12, -0.03, ..." />
						</template>
					</a-form-item>
				</a-col>

				<a-col :span="12">
					<a-form-item label="过滤字段">
						<a-input v-model:value="state.filterColumn" placeholder="例如: cell_type / disease" />
					</a-form-item>
				</a-col>

				<a-col :span="12">
					<a-form-item label="过滤值">
						<a-input v-model:value="state.filterValue" placeholder="例如: T-cell / normal" />
					</a-form-item>
				</a-col>

				<a-col :span="12">
					<a-form-item label="Top-K" name="k">
						<a-input-number v-model:value="state.k" :min="1" :max="100" style="width:100%" />
					</a-form-item>
				</a-col>

				<a-col :span="12">
					<a-form-item label="过滤召回倍数" name="oversample">
						<a-input-number v-model:value="state.oversample" :min="1" :max="100" style="width:100%" />
					</a-form-item>
				</a-col>

				<a-col :span="24" style="text-align:right">
					<a-button type="primary" @click="handleSubmit">开始检索</a-button>
				</a-col>
			</a-row>
		</a-form>
	</a-card>
</template>

<script setup lang="ts">
import { reactive, toRefs, ref, watch } from "vue"
import { message } from "ant-design-vue"
import type { SearchPayload } from "@/api/search"

const props = withDefaults(defineProps<{ modelValue: SearchPayload & { filters: { cell_type: string } } }>(), {
	modelValue: () => ({
		queryType: "id",
		query: "",
		k: 10,
		oversample: 10,
		filterColumn: "",
		filterValue: "",
		filters: { cell_type: "" },
	}),
})

const emit = defineEmits<{
	(e: "submit", payload: SearchPayload & { filters: { cell_type: string } }): void
	(e: "update:modelValue", value: SearchPayload & { filters: { cell_type: string } }): void
}>()

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

const { queryType, query, k, oversample, filterColumn, filterValue, filters } = toRefs(state)
</script>

<style scoped>
.search-form { padding: 12px; border: 1px solid #eee; border-radius: 6px; }
</style>
