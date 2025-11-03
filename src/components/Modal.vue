


<template>
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="show" class="modal-overlay" @click.self="handleClose">
          <div class="modal-container">
            <div class="modal-header">
              <h2 class="modal-title">{{ title }}</h2>
              <button @click="handleClose" class="modal-close" type="button">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <slot></slot>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </template>
  
  <script setup>
  import { watch } from 'vue';
  
  const props = defineProps({
    show: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: 'Modal'
    },
    closeOnOverlay: {
      type: Boolean,
      default: true
    }
  });
  
  const emit = defineEmits(['update:show', 'close']);
  
  const handleClose = () => {
    if (props.closeOnOverlay || !props.closeOnOverlay) {
      emit('update:show', false);
      emit('close');
    }
  };
  
  watch(() => props.show, (newVal) => {
    if (newVal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  });
  </script>
  
  <style scoped>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: var(--spacing-lg);
  }
  
  .modal-container {
    background: var(--bg-card);
    border-radius: var(--radius-xl);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: modalSlideIn 0.3s ease-out;
  }
  
  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-xl);
    border-bottom: 1px solid var(--border-color);
  }
  
  .modal-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }
  
  .modal-close {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: var(--spacing-xs);
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-fast);
  }
  
  .modal-close:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }
  
  .modal-body {
    padding: var(--spacing-xl);
    overflow-y: auto;
    flex: 1;
  }
  
  /* Transiciones */
  .modal-enter-active,
  .modal-leave-active {
    transition: opacity 0.3s ease;
  }
  
  .modal-enter-from,
  .modal-leave-to {
    opacity: 0;
  }
  
  .modal-enter-active .modal-container,
  .modal-leave-active .modal-container {
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
  
  .modal-enter-from .modal-container,
  .modal-leave-to .modal-container {
    transform: translateY(-20px) scale(0.95);
    opacity: 0;
  }
  
  @media (max-width: 768px) {
    .modal-overlay {
      padding: var(--spacing-md);
    }
  
    .modal-container {
      max-width: 100%;
      max-height: 95vh;
    }
  
    .modal-header {
      padding: var(--spacing-lg);
    }
  
    .modal-title {
      font-size: 1.25rem;
    }
  
    .modal-body {
      padding: var(--spacing-lg);
    }
  }
  </style>