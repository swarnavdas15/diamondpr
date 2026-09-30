import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { handleCreateClient, handleListClients, handleUploadProfileImage, handleCreateCompanyContact, handleListCompanyContacts, handleUploadContactProfileImage } from './client.controller';
import { uploadImage } from '../../middlewares/upload.middleware';

const router = Router();

// All authenticated users can view/list clients (required for ERP dashboard data across all department roles)
router.post('/', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN', 'SALES']), handleCreateClient);
router.get('/', authenticateToken, handleListClients);
router.patch('/:id/profile-image', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN', 'SALES']), uploadImage.single('profileImage'), handleUploadProfileImage);

// Company Contacts
router.post('/contacts', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN', 'SALES']), handleCreateCompanyContact);
router.get('/contacts', authenticateToken, handleListCompanyContacts);
router.patch('/contacts/:contactId/profile-image', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN', 'SALES']), uploadImage.single('profileImage'), handleUploadContactProfileImage);

export default router;
