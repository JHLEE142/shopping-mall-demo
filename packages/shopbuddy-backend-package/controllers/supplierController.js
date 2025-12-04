import Supplier from '../models/Supplier.js';
import SupplierProduct from '../models/SupplierProduct.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { calculatePagination } from '../utils/helpers.js';

// 관리자: 공급사 목록 조회
export const getSuppliers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const suppliers = await Supplier.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Supplier.countDocuments();
    const pagination = calculatePagination(page, limit, total);

    paginatedResponse(res, { suppliers }, pagination, '공급사 목록 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// 관리자: 공급사 등록
export const createSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);
    successResponse(res, { supplier }, '공급사가 등록되었습니다.', 201);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 관리자: 공급사 수정
export const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await Supplier.findByIdAndUpdate(id, req.body, { new: true });

    if (!supplier) {
      return errorResponse(res, '공급사를 찾을 수 없습니다.', 404);
    }

    successResponse(res, { supplier }, '공급사 정보가 수정되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 관리자: 공급사 상품 동기화
export const syncSupplierProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await Supplier.findById(id);

    if (!supplier) {
      return errorResponse(res, '공급사를 찾을 수 없습니다.', 404);
    }

    // TODO: 실제 공급사 API 호출하여 상품 동기화
    // 여기서는 예시
    const synced = 0;
    const errors = [];

    supplier.syncSettings.lastSyncAt = new Date();
    await supplier.save();

    successResponse(res, {
      synced,
      errors
    }, '동기화가 시작되었습니다.');
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// 관리자: 공급사 상품 목록 조회
export const getSupplierProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, syncStatus } = req.query;

    const query = { supplierId: id };
    if (syncStatus) query.syncStatus = syncStatus;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const products = await SupplierProduct.find(query)
      .populate('productId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SupplierProduct.countDocuments(query);
    const pagination = calculatePagination(page, limit, total);

    paginatedResponse(res, { products }, pagination, '공급사 상품 목록 조회 성공');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

