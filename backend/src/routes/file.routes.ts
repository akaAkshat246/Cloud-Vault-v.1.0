import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { uploadService } from '../services/upload.service.js';
import { fileService } from '../services/file.service.js';
import { BadRequestError } from '../utils/errors.js';

export const fileRouter = Router();

// Enforce authentication on file, upload, and folder endpoints
fileRouter.use('/files', authenticate);
fileRouter.use('/folders', authenticate);

// ==========================================
// 1. Direct-to-S3 Chunked Upload Endpoints
// ==========================================

// Phase 1: Two-Phase Quota Reservation & Multipart Upload Initiation
fileRouter.post('/files/uploads', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      expected_bytes,
      total_chunks,
      chunk_size,
      encrypted_name,
      name_nonce,
      encrypted_fek,
      fek_nonce,
      folder_id,
      mime_type_encrypted,
      format_version
    } = req.body;

    if (expected_bytes === undefined || !total_chunks || !encrypted_name || !name_nonce || !encrypted_fek || !fek_nonce) {
      throw new BadRequestError('Missing required upload initiation parameters');
    }

    const result = await uploadService.initiateUpload(req.user!.id, {
      expected_bytes: Number(expected_bytes),
      total_chunks: Number(total_chunks),
      chunk_size: chunk_size ? Number(chunk_size) : undefined,
      encrypted_name,
      name_nonce,
      encrypted_fek,
      fek_nonce,
      folder_id,
      mime_type_encrypted,
      format_version: format_version ? Number(format_version) : 1
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// Phase 2: Batch Presigned Part URLs Generation
fileRouter.post('/files/uploads/:id/parts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { chunk_indices } = req.body;

    if (!Array.isArray(chunk_indices) || chunk_indices.length === 0) {
      throw new BadRequestError('chunk_indices must be a non-empty array of numbers');
    }

    const parts = await uploadService.getPresignedPartUrls(req.user!.id, sessionId, chunk_indices);
    res.status(200).json({ parts });
  } catch (error) {
    next(error);
  }
});

// Resumable Status Check (S3 Ground Truth)
fileRouter.get('/files/uploads/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const status = await uploadService.getUploadStatus(req.user!.id, sessionId);
    res.status(200).json(status);
  } catch (error) {
    next(error);
  }
});

// Phase 3: Complete Multipart Upload & Finalize Quota
fileRouter.post('/files/uploads/:id/complete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { parts } = req.body;

    if (!Array.isArray(parts)) {
      throw new BadRequestError('parts array is required to complete upload');
    }

    const result = await uploadService.completeUpload(req.user!.id, sessionId, { parts });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// Phase 4: Abort Upload & Release Reserved Quota
fileRouter.post('/files/uploads/:id/abort', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await uploadService.abortUpload(req.user!.id, sessionId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 2. File Download & Metadata Endpoints
// ==========================================

// Get Presigned Download URL with Wrapped FEK and Metadata
fileRouter.get('/files/:id/download-info', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fileId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const info = await fileService.getDownloadInfo(req.user!.id, fileId);
    res.status(200).json(info);
  } catch (error) {
    next(error);
  }
});

// List Files in Folder (or root)
fileRouter.get('/files', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const folderId = req.query.folder_id ? String(req.query.folder_id) : null;
    const files = await fileService.listFiles(req.user!.id, folderId);
    res.status(200).json({ files });
  } catch (error) {
    next(error);
  }
});

// Get Single File Metadata
fileRouter.get('/files/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fileId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const file = await fileService.getFile(req.user!.id, fileId);
    res.status(200).json(file);
  } catch (error) {
    next(error);
  }
});

// Update File Metadata / Move
fileRouter.patch('/files/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fileId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updated = await fileService.updateFile(req.user!.id, fileId, req.body);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
});

// Soft Delete (Trash File)
fileRouter.delete('/files/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fileId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await fileService.trashFile(req.user!.id, fileId);
    res.status(200).json({ message: 'File moved to trash' });
  } catch (error) {
    next(error);
  }
});

// Restore File from Trash
fileRouter.post('/files/:id/restore', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fileId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await fileService.restoreFile(req.user!.id, fileId);
    res.status(200).json({ message: 'File restored from trash' });
  } catch (error) {
    next(error);
  }
});

// Permanent Delete File
fileRouter.delete('/files/:id/permanent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fileId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await fileService.permanentDeleteFile(req.user!.id, fileId);
    res.status(200).json({ message: 'File permanently deleted' });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 3. Folder CRUD Endpoints
// ==========================================

// Create Folder
fileRouter.post('/folders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { encrypted_name, name_nonce, parent_id } = req.body;
    if (!encrypted_name || !name_nonce) {
      throw new BadRequestError('encrypted_name and name_nonce are required');
    }
    const folder = await fileService.createFolder(req.user!.id, {
      encrypted_name,
      name_nonce,
      parent_id: parent_id || null
    });
    res.status(201).json(folder);
  } catch (error) {
    next(error);
  }
});

// List Folders
fileRouter.get('/folders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parentId = req.query.parent_id ? String(req.query.parent_id) : null;
    const folders = await fileService.listFolders(req.user!.id, parentId);
    res.status(200).json({ folders });
  } catch (error) {
    next(error);
  }
});

// Update / Move Folder
fileRouter.patch('/folders/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const folderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updated = await fileService.updateFolder(req.user!.id, folderId, req.body);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
});

// Trash Folder
fileRouter.delete('/folders/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const folderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await fileService.trashFolder(req.user!.id, folderId);
    res.status(200).json({ message: 'Folder moved to trash' });
  } catch (error) {
    next(error);
  }
});
