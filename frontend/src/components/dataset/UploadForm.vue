<template>
	<a-card title="上传数据集">
		<a-upload-dragger
			:before-upload="beforeUpload"
			:file-list="fileList"
			@change="onChange"
			:show-upload-list="true"
			:max-count="1"
		>
			<p class="ant-upload-drag-icon">📦</p>
			<p class="ant-upload-text">拖拽 .h5ad / .csv 文件到这里，或点击选择文件</p>
			<p class="ant-upload-hint">当前为演示模式，不会真正上传到后端。</p>
		</a-upload-dragger>

		<a-progress v-if="progress > 0" :percent="progress" style="margin-top: 16px" />

		<div style="margin-top: 12px; display:flex; gap:8px; justify-content:flex-end">
			<a-button :disabled="!selectedFile" @click="simulateUpload">模拟上传</a-button>
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
