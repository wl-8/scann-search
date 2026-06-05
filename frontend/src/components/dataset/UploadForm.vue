<template>
	<a-card class="upload-card workbench-panel" :bordered="false" title="上传数据集">
		<div class="upload-card__body">
			<a-upload-dragger
				:before-upload="beforeUpload"
				:file-list="fileList"
				:show-upload-list="false"
				:max-count="1"
				:disabled="fileUploading"
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
					<p class="upload-dragger__title">
						<span v-if="fileUploading">正在上传到服务器…</span>
						<span v-else-if="uploadedFilename">已上传：{{ uploadedFilename }}</span>
						<span v-else>拖拽 .h5ad 文件到这里，或点击选择</span>
					</p>
					<p v-if="!fileUploading && !uploadedFilename" class="upload-dragger__subtitle">文件会上传到服务器，上传完成后再填写信息点注册</p>
					<a-progress v-if="fileUploading" :percent="fileUploadProgress" :show-info="false" style="margin: 8px 16px 0" />
				</div>
			</a-upload-dragger>

					<a-form layout="vertical" style="margin-top: 12px">
						<a-form-item label="服务器绝对路径（拖拽上传后自动填入，或手动输入）">
							<a-input v-model:value="sourcePath" placeholder="例如: /home/user/scann-search/backend/data/uploads/my_dataset.h5ad" />
						</a-form-item>
						<a-form-item label="Embedding Key">
							<a-select
								v-if="embeddingKeyOptions.length"
								v-model:value="embeddingKey"
								:options="embeddingKeyOptions"
								placeholder="选择向量 key"
								style="width: 100%"
							/>
							<a-input
								v-else
								v-model:value="embeddingKey"
								placeholder="如 X_pca 或 X_umap（上传文件后自动检测）"
							/>
						</a-form-item>
						<a-form-item label="数据集名称">
							<a-input v-model:value="name" placeholder="数据集显示名称" />
						</a-form-item>
						<a-progress v-if="progress > 0" :percent="progress" class="upload-progress" />
						<div class="upload-actions">
							<a-button class="upload-button" type="primary" :loading="loading" @click="submitRegister">注册数据集</a-button>
						</div>
					</a-form>
		</div>
	</a-card>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { message } from "ant-design-vue"
import * as datasetsApi from "@/api/datasets"
import request from "@/api/request"
import { showErrMsg } from "@/utils/error"

const emit = defineEmits<{ (e: "uploaded", payload: { name: string; size: number }): void }>()

const fileList = ref<any[]>([])
const sourcePath = ref("")
const embeddingKey = ref("X_pca")
const name = ref("")
const loading = ref(false)
const progress = ref(0)

// 文件上传状态
const fileUploading = ref(false)
const fileUploadProgress = ref(0)
const uploadedFilename = ref("")
const embeddingKeyOptions = ref<{ label: string; value: string }[]>([])

async function beforeUpload(file: File) {
	fileList.value = [file as any]
	uploadedFilename.value = ""
	fileUploading.value = true
	fileUploadProgress.value = 10

	const formData = new FormData()
	formData.append("file", file)

	try {
		// 用 XMLHttpRequest 获取上传进度
		const result = await new Promise<{ path: string; filename: string; embedding_keys?: string[] }>((resolve, reject) => {
			const xhr = new XMLHttpRequest()
			xhr.open("POST", `${import.meta.env.VITE_API_BASE ?? "/api"}/datasets/upload-file`)
			const token = localStorage.getItem("token")
			if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`)
			xhr.upload.onprogress = (e) => {
				if (e.lengthComputable) fileUploadProgress.value = Math.round((e.loaded / e.total) * 90)
			}
			xhr.onload = () => {
				if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText))
				else reject(new Error(JSON.parse(xhr.responseText)?.detail ?? `上传失败 ${xhr.status}`))
			}
			xhr.onerror = () => reject(new Error("网络错误"))
			xhr.send(formData)
		})

		fileUploadProgress.value = 100
		sourcePath.value = result.path
		uploadedFilename.value = result.filename ?? file.name
		// 用后端返回的 obsm keys 填充下拉
		if (result.embedding_keys?.length) {
			embeddingKeyOptions.value = result.embedding_keys.map((k: string) => ({ label: k, value: k }))
			// 优先选 X_pca，否则选第一个
			embeddingKey.value = result.embedding_keys.includes("X_pca")
				? "X_pca"
				: result.embedding_keys[0]
		}
		message.success(`文件已上传：${result.filename}，请填写信息后点注册`)
	} catch (err: any) {
		showErrMsg(err, "文件上传失败")
		fileList.value = []
	} finally {
		fileUploading.value = false
	}

	return false  // 阻止 antd 默认上传行为
}

async function submitRegister() {
	if (!name.value) return message.warning("请填写数据集名称")
	if (!sourcePath.value) return message.warning("请先上传文件或填写服务器路径")

	const payload = {
		name: name.value,
		source_path: sourcePath.value,
		embedding_key: embeddingKey.value || "X_pca",
	}

	loading.value = true
	progress.value = 10
	try {
		await datasetsApi.registerDataset(payload as any)
		progress.value = 100
		message.success("数据集注册成功，正在处理中…")
		emit("uploaded", { name: payload.name, size: 0 })
		// 重置表单
		name.value = ""
		sourcePath.value = ""
		embeddingKey.value = "X_pca"
		uploadedFilename.value = ""
		embeddingKeyOptions.value = []
		fileList.value = []
	} catch (err: any) {
		showErrMsg(err, "注册失败")
	} finally {
		loading.value = false
		setTimeout(() => (progress.value = 0), 800)
	}
}
</script>

<style scoped>
.upload-card {
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.upload-card :deep(.ant-card-body) {
	padding: 8px 16px 16px;
}

.upload-card :deep(.ant-form-item) {
	margin-bottom: 12px;
}

.upload-card__body {
	padding: 0;
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
	min-height: 110px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 6px;
	padding: 10px 20px;
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

:deep(.ant-upload-wrapper) {
	border: none !important;
}

:deep(.ant-upload-list) {
	margin-top: 12px;
}

:deep(.ant-upload-list-item) {
	border-radius: 10px;
	background: #f8fafc;
}

.upload-card {
	border-radius: 9px;
	background: var(--bio-panel);
	border-color: var(--bio-line);
	box-shadow: none;
	height: 100%;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.upload-card :deep(.ant-card-body) {
	flex: 1;
	min-height: 0;
	overflow-y: auto;
}

.upload-card :deep(.ant-card-head) {
	min-height: 54px;
	background: #ffffff;
	border-bottom-color: var(--bio-line);
}

.upload-card :deep(.ant-card-head-title) {
	color: var(--bio-text);
	font-weight: 760;
}

.upload-card__body {
	padding: 16px;
}

.upload-dragger {
	border: none !important;
	border-radius: 8px !important;
	background: transparent !important;
	box-shadow: none !important;
}

:deep(.ant-upload-wrapper) {
	border: none !important;
}

:deep(.ant-upload-drag) {
	border: 1px dashed rgba(20, 123, 209, 0.42) !important;
	border-radius: 8px !important;
	background: #f7fbfd !important;
	box-shadow: none !important;
}

:deep(.ant-upload-drag:hover) {
	background: #eaf6fd !important;
	border-color: var(--bio-blue) !important;
}

.upload-dragger__content {
	min-height: 155px;
	padding: 18px 16px;
}

.upload-dragger__icon {
	width: 52px;
	height: 52px;
	border-radius: 8px;
	color: var(--bio-blue);
	background: #ffffff;
	box-shadow: inset 0 0 0 1px var(--bio-line);
}

.upload-dragger__title {
	color: var(--bio-text);
	font-size: 1rem;
}

.upload-dragger__subtitle,
.upload-dragger__hint {
	color: var(--bio-muted);
}

.upload-button {
	height: 38px;
	border-radius: 7px;
	box-shadow: none;
}

.upload-button:hover:not(:disabled) {
	transform: none;
	box-shadow: none;
	filter: none;
}

:deep(.ant-upload-list-item) {
	border-radius: 7px;
	background: var(--bio-panel-muted);
}
</style>
