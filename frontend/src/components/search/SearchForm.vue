<template>
	<a-card class="search-card" :bordered="false">
		<div class="search-card__head">
			<div>
				<div class="search-card__kicker">Search Console</div>
				<h3>检索控制台</h3>
			</div>
			<p>在这里配置查询类型、索引参数和过滤条件。</p>
		</div>

		<a-form
			:model="state"
			:rules="rules"
			ref="formRef"
			layout="vertical"
			class="search-form"
			@submit.prevent
		>
			<div class="form-section">
				<div class="form-section__title">基本设置</div>
				<a-row :gutter="16">
					<a-col :span="24">
						<a-form-item label="输入类型" name="queryType">
							<a-radio-group v-model:value="state.queryType" class="radio-group">
								<a-radio value="id">细胞ID</a-radio>
								<a-radio value="vector">向量</a-radio>
							</a-radio-group>
						</a-form-item>
					</a-col>

					<a-col :span="24">
						<a-form-item :label="state.queryType === 'id' ? '细胞ID' : '向量（逗号分隔）'" :name="'query'">
							<template v-if="state.queryType === 'id'">
								<a-input v-model:value="state.query" class="control-input" placeholder="例如: cell_12345" />
							</template>
							<template v-else>
								<a-input-textarea v-model:value="state.query" class="control-input control-input--textarea" :auto-size="{ minRows: 4, maxRows: 6 }" placeholder="例如: 0.12, -0.03, ..." />
							</template>
						</a-form-item>
					</a-col>
				</a-row>
			</div>

			<div class="form-section">
				<div class="form-section__title">高级参数</div>
				<a-row :gutter="16">
					<a-col :span="12">
						<a-form-item label="过滤字段">
							<a-input v-model:value="state.filterColumn" class="control-input" placeholder="例如: cell_type / disease" />
						</a-form-item>
					</a-col>

					<a-col :span="12">
						<a-form-item label="过滤值">
							<a-input v-model:value="state.filterValue" class="control-input" placeholder="例如: T-cell / normal" />
						</a-form-item>
					</a-col>

					<a-col :span="12">
						<a-form-item label="Top-K" name="k">
							<a-input-number v-model:value="state.k" :min="1" :max="100" class="control-number" />
						</a-form-item>
					</a-col>

					<a-col :span="12">
						<a-form-item label="过滤召回倍数" name="oversample">
							<a-input-number v-model:value="state.oversample" :min="1" :max="100" class="control-number" />
						</a-form-item>
					</a-col>
				</a-row>
			</div>

			<div class="search-card__footer">
				<a-button type="primary" class="submit-button" @click="handleSubmit">开始检索</a-button>
			</div>
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
.search-card {
	border-radius: 18px;
	background: #ffffff;
	box-shadow:
		0 24px 54px rgba(15, 23, 42, 0.06),
		0 8px 16px rgba(15, 23, 42, 0.04);
	border: 1px solid rgba(148, 163, 184, 0.14);
	overflow: hidden;
}

.search-card__head {
	padding: 18px 18px 14px;
	border-bottom: 1px solid rgba(226, 232, 240, 0.9);
	background: linear-gradient(180deg, #fbfdff 0%, #f8fafc 100%);
}

.search-card__kicker {
	font-size: 0.78rem;
	font-weight: 800;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: #007bff;
}

.search-card__head h3 {
	margin: 6px 0 0;
	font-size: 1.05rem;
	font-weight: 800;
	color: #0f172a;
}

.search-card__head p {
	margin: 8px 0 0;
	color: #64748b;
	line-height: 1.6;
}

.search-form {
	padding: 18px;
}

.form-section {
	padding: 14px 0 6px;
}

.form-section + .form-section {
	margin-top: 8px;
	padding-top: 18px;
	border-top: 1px solid rgba(226, 232, 240, 0.95);
}

.form-section__title {
	margin-bottom: 14px;
	font-size: 0.84rem;
	font-weight: 800;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: #64748b;
}

.radio-group {
	display: inline-flex;
	gap: 14px;
	padding: 8px 12px;
	border-radius: 12px;
	background: #f8fafc;
	border: 1px solid rgba(148, 163, 184, 0.16);
}

.control-input,
.control-select,
.control-number {
	width: 100%;
}

.search-form :deep(.ant-input),
.search-form :deep(.ant-input-number),
.search-form :deep(.ant-select-selector),
.search-form :deep(.ant-input-textarea) {
	border-radius: 12px !important;
	border-color: #dbe4ee !important;
	box-shadow: none !important;
	transition:
		border-color 0.2s ease,
		box-shadow 0.2s ease,
		transform 0.2s ease;
}

.search-form :deep(.ant-input),
.search-form :deep(.ant-input-number-input),
.search-form :deep(.ant-select-selection-item),
.search-form :deep(.ant-select-selection-placeholder) {
	color: #0f172a;
}

.search-form :deep(.ant-input:hover),
.search-form :deep(.ant-input-number:hover),
.search-form :deep(.ant-select:not(.ant-select-disabled):hover .ant-select-selector) {
	border-color: rgba(0, 123, 255, 0.36) !important;
}

.search-form :deep(.ant-input:focus),
.search-form :deep(.ant-input-focused),
.search-form :deep(.ant-input-number-focused),
.search-form :deep(.ant-select-focused .ant-select-selector),
.search-form :deep(.ant-input-affix-wrapper-focused),
.search-form :deep(.ant-input-number-focused .ant-input-number-input) {
	border-color: #007bff !important;
	box-shadow: 0 0 0 4px rgba(0, 123, 255, 0.12) !important;
}

.search-form :deep(.ant-radio-wrapper) {
	color: #334155;
	font-weight: 600;
}

.search-card__footer {
	padding-top: 12px;
}

.submit-button {
	width: 100%;
	height: 44px;
	border-radius: 14px;
	font-weight: 800;
	box-shadow: 0 14px 26px rgba(0, 123, 255, 0.2);
	transition:
		transform 0.18s ease,
		box-shadow 0.18s ease,
		filter 0.18s ease;
}

.submit-button:hover {
	transform: translateY(-1px) scale(1.02);
	filter: brightness(1.03);
	box-shadow: 0 18px 30px rgba(0, 123, 255, 0.24);
}

.submit-button:active {
	transform: translateY(1px) scale(0.99);
}

@media (max-width: 1100px) {
	.search-card {
		margin-bottom: 0;
	}
}

@media (max-width: 720px) {
	.search-form {
		padding: 14px;
	}

	.search-card__head {
		padding: 16px 14px 12px;
	}

	.radio-group {
		width: 100%;
		justify-content: space-between;
	}
}
</style>
