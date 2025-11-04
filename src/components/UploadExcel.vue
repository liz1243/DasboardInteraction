<template>
  <div class="upload-container glass-card">
    <div class="upload-header">
      <p class="upload-description">Upload an Excel file with your campaigns data</p>
    </div>

    <div
      class="dropzone"
      :class="{ 'drag-over': isDragOver }"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <input
        ref="fileInput"
        type="file"
        accept=".xlsx,.xls,.csv"
        @change="handleFileSelect"
        class="file-input"
      />
      
      <div class="dropzone-content">
        <div class="dropzone-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
        </div>
        <p class="dropzone-text">
          <span class="dropzone-text-main">Drag your file here</span>
          <span class="dropzone-text-sub">or click to select</span>
        </p>
        <p class="dropzone-hint">Supported files: .xlsx, .xls, .csv</p>
      </div>
    </div>

    <div v-if="selectedFile" class="file-info">
      <div class="file-info-content">
        <div class="file-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
            <polyline points="13 2 13 9 20 9"></polyline>
          </svg>
        </div>
        <div class="file-details">
          <p class="file-name">{{ selectedFile.name }}</p>
          <p class="file-size">{{ formatFileSize(selectedFile.size) }}</p>
        </div>
        <button @click="clearFile" class="btn-remove" type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>

    <div v-if="error" class="error-message">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span>{{ error }}</span>
    </div>

    <button
      @click="handleUpload"
      :disabled="!selectedFile || loading"
      class="btn-modern btn-upload"
      type="button"
    >
      <span v-if="loading" class="spinner"></span>
      <span v-else>Process File</span>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['upload']);

const fileInput = ref(null);
const selectedFile = ref(null);
const isDragOver = ref(false);
const loading = ref(false);
const error = ref(null);

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedFile.value = file;
    error.value = null;
  }
};

const handleDragOver = (event) => {
  isDragOver.value = true;
};

const handleDragLeave = () => {
  isDragOver.value = false;
};

const handleDrop = (event) => {
  isDragOver.value = false;
  const file = event.dataTransfer.files[0];
  if (file) {
    selectedFile.value = file;
    error.value = null;
  }
};

const clearFile = () => {
  selectedFile.value = null;
  error.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const handleUpload = async () => {
  if (!selectedFile.value) return;

  loading.value = true;
  error.value = null;

  try {
    emit('upload', selectedFile.value);
  } catch (err) {
    error.value = err.message || 'Error processing the file';
  } finally {
    loading.value = false;
  }
};

defineExpose({
  clearFile,
  setError: (err) => { error.value = err; }
});
</script>

<style scoped>
.upload-container {
  padding: var(--spacing-xl);
}

.upload-header {
  margin-bottom: var(--spacing-xl);
}

.upload-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.upload-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.dropzone {
  margin-bottom: var(--spacing-lg);
  position: relative;
}

.file-input {
  display: none;
}

.dropzone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
}

.dropzone-icon {
  color: var(--accent-cyan);
  opacity: 0.6;
  transition: all var(--transition-base);
}

.dropzone:hover .dropzone-icon,
.dropzone.drag-over .dropzone-icon {
  opacity: 1;
  transform: translateY(-4px);
}

.dropzone-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
}

.dropzone-text-main {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-primary);
}

.dropzone-text-sub {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.dropzone-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: var(--spacing-xs);
}

.file-info {
  margin-bottom: var(--spacing-lg);
}

.file-info-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.file-icon {
  color: var(--accent-cyan);
  flex-shrink: 0;
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: var(--spacing-xs) 0 0 0;
}

.btn-remove {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: var(--spacing-xs);
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.btn-remove:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.error-message {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid rgba(255, 0, 0, 0.3);
  border-radius: var(--radius-md);
  color: #ff6b6b;
  font-size: 0.875rem;
  margin-bottom: var(--spacing-lg);
}

.btn-upload {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: 1rem;
}

.btn-upload:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-upload:disabled:hover {
  transform: none;
  border-color: var(--border-color);
  box-shadow: none;
}
</style>

