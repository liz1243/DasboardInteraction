import { createRouter, createWebHistory } from 'vue-router';
import DashboardView from './modules/dashboard/DashboardView.vue';
import ClientView from './modules/dashboard/ClientView.vue';

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: DashboardView
  },
  {
    path: '/client/:cliente/:talento?/:source?',
    name: 'client',
    component: ClientView,
    props: true
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router;

