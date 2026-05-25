<template>
	<a-card class="upload-card" :bordered="false" title="上传数据集">
		<div class="upload-card__body">
			<a-upload-dragger
				:before-upload="beforeUpload"
				:file-list="fileList"
				@change="onChange"
				:show-upload-list="true"
				:max-count="1"
				class="upload-dragger"
			>
				<div class="upload-dragger__content">
					<div class="upload-dragger__icon" aria-hidden="true">
						<svg viewBox="0 0 24 24">
							<path d="M7 18a4 4 0 010-8 5 5 0 019.7-1.2A3.5 3.5 0 1118 18H7z" />
							<path d="M12 8v8" />
							<path d="M9 11l3-3 3 3" />
						</svg>
					</div>
					<p class="upload-dragger__title">拖拽文件到这里</p>
					<p class="upload-dragger__subtitle">拖拽 .h5ad / .csv 文件到这里，或点击选择文件</p>
					<p class="upload-dragger__hint">当前为演示模式，不会真正上传到后端。</p>
				</div>
			</a-upload-dragger>

			<a-progress v-if="progress > 0" :percent="progress" class="upload-progress" />

			<div class="upload-actions">
				<a-button class="upload-button" :disabled="!selectedFile" @click="simulateUpload">模拟上传</a-button>
			</div>
		</div>
	</a-card>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { message } from "ant-design-vue"

const emit = defineEmits<{ (e: "uploaded", payload: { name: string; size: number }): void }>()

const fileList = ref<any[]>([])
const selectedFile = ref<File | null>(null)
const progress = ref(0)

function beforeUpload(file: File) {
	selectedFile.value = file
	fileList.value = [file as any]
	return false
}

function onChange(info: any) {
	if (info.file?.originFileObj) selectedFile.value = info.file.originFileObj as File
}

function simulateUpload() {
	if (!selectedFile.value) return
	progress.value = 0
	const timer = setInterval(() => {
		progress.value = Math.min(100, progress.value + 20)
		if (progress.value >= 100) {
			clearInterval(timer)
			const file = selectedFile.value
			if (!file) return
			message.success(`已模拟上传：${file.name}`)
			emit("uploaded", { name: file.name, size: file.size })
		}
	}, 200)
}
</script>

<style scoped>
.upload-card {
	border-radius: 16px;
	background: #fff;
	border: 1px solid rgba(148, 163, 184, 0.14);
	box-shadow:
		0 24px 54px rgba(15, 23, 42, 0.06),
		0 8px 16px rgba(15, 23, 42, 0.04);
	overflow: hidden;
}

.upload-card :deep(.ant-card-head) {
	border-bottom: 1px solid rgba(226, 232, 240, 0.95);
	background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.upload-card :deep(.ant-card-head-title) {
	font-weight: 800;
	color: #0f172a;
}

.upload-card__body {
	padding: 24px;
}

.upload-dragger {
	border: 1.5px dashed rgba(0, 123, 255, 0.34) !important;
	border-radius: 16px !important;
	background: #f0f9ff !important;
	transition:
		background-color 0.18s ease,
		border-color 0.18s ease,
		transform 0.18s ease,
		box-shadow 0.18s ease;
}

.upload-dragger:hover,
.upload-dragger:focus-within {
	background: #eaf6ff !important;
	border-color: rgba(0, 123, 255, 0.52) !important;
	box-shadow: 0 12px 24px rgba(0, 123, 255, 0.08);
	transform: translateY(-1px);
}

.upload-dragger__content {
	min-height: 240px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 10px;
	padding: 24px 20px;
	text-align: center;
}

.upload-dragger__icon {
	width: 64px;
	height: 64px;
	border-radius: 20px;
	display: grid;
	place-items: center;
	color: #007bff;
	background: rgba(255, 255, 255, 0.72);
	box-shadow: inset 0 0 0 1px rgba(0, 123, 255, 0.08);
}

.upload-dragger__icon svg {
	width: 34px;
	height: 34px;
	fill: none;
	stroke: currentColor;
	stroke-width: 1.9;
	stroke-linecap: round;
	stroke-linejoin: round;
}

.upload-dragger__title {
	margin: 0;
	font-size: 1.08rem;
	font-weight: 800;
	color: #0f172a;
}

.upload-dragger__subtitle {
	margin: 0;
	color: #475569;
	font-size: 0.95rem;
	line-height: 1.6;
}

.upload-dragger__hint {
	margin: 0;
	color: #94a3b8;
	font-size: 0.84rem;
	line-height: 1.5;
}

.upload-progress {
	margin-top: 16px;
}

.upload-actions {
	margin-top: 16px;
	display: flex;
	justify-content: center;
}

.upload-button {
	min-width: 180px;
	height: 42px;
	border-radius: 12px;
	font-weight: 800;
	box-shadow: 0 14px 26px rgba(0, 123, 255, 0.18);
	transition:
		transform 0.18s ease,
		box-shadow 0.18s ease,
		filter 0.18s ease;
}

.upload-button:hover:not(:disabled) {
	transform: translateY(-1px) scale(1.02);
	box-shadow: 0 18px 30px rgba(0, 123, 255, 0.24);
	filter: brightness(1.03);
}

.upload-button:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

@media (max-width: 720px) {
	.upload-card__body {
		padding: 16px;
	}

	.upload-dragger__content {
		min-height: 210px;
		padding: 20px 14px;
	}

	.upload-button {
		width: 100%;
	}
}

:deep(.ant-upload-list) {
	margin-top: 12px;
}

:deep(.ant-upload-list-item) {
	border-radius: 10px;
	background: #f8fafc;
}
</style>
