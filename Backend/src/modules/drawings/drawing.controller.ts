import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { DrawingService } from './drawing.service';
import { uploadToCloudinary } from '../../utils/cloudinary';

// 1. Upload Technical Drawing (CAD / PDF / Image) to Cloudinary
export const uploadDrawingHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.body;

    // Check file presence from Multer uploadDrawing middleware
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Drawing file is required' });
    }

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }

    // Upload Buffer to Cloudinary
    const cloudinaryUrl = await uploadToCloudinary(req.file.buffer, req.file.originalname);

    // Save record with Cloudinary URL in PostgreSQL database
    const drawing = await DrawingService.uploadDrawing(
      {
        orderId,
        filename: req.file.originalname,
        fileUrl: cloudinaryUrl
      },
      req.user!.userId
    );

    res.status(201).json({
      success: true,
      message: 'Drawing uploaded successfully to Cloudinary',
      drawing
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Fetch All Drawings for a Specific Order
export const getDrawingsByOrderHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID parameter is required'
      });
    }

    const drawings = await DrawingService.getOrderDrawings(orderId as string);

    res.status(200).json({
      success: true,
      count: drawings.length,
      drawings
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve drawings for the specified order'
    });
  }
};