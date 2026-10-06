import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/role.middleware';
import { handleCreateClient, handleListClients, handleUpdateClient, handleDeleteClient, handleUploadProfileImage, handleUploadPrimaryContactProfileImage, handleCreateCompanyContact, handleListCompanyContacts, handleUploadContactProfileImage } from './client.controller';
import { uploadImage } from '../../middlewares/upload.middleware';

const router = Router();

// Only Sales, Admin, Super Admin can manage & view complete Client list
router.post('/', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN', 'SALES']), handleCreateClient);
router.get('/', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN', 'SALES']), handleListClients);
router.patch('/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN', 'SALES']), handleUpdateClient);
router.delete('/:id', authenticateToken, requireRole(['SUPER_ADMIN']), handleDeleteClient);
router.patch('/:id/profile-image', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN', 'SALES']), uploadImage.single('profileImage'), handleUploadProfileImage);
router.patch('/:id/primary-contact-image', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN', 'SALES']), uploadImage.single('profileImage'), handleUploadPrimaryContactProfileImage);

// Company Contacts
router.post('/contacts', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN', 'SALES']), handleCreateCompanyContact);
router.get('/contacts', authenticateToken, handleListCompanyContacts);
router.patch('/contacts/:contactId/profile-image', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN', 'SALES']), uploadImage.single('profileImage'), handleUploadContactProfileImage);

export default router;
