const express = require('express');
const router = express.Router();
const { validate, validateQuery, validateParams, schemas } = require('../utils/validationMiddleware');
const { authenticate, isAdmin, isInvoiceOwnerOrAdmin } = require('../utils/authMiddleware');

/**
 * @route   GET /facturas
 * @desc    Lista todas las facturas (admin) o las facturas del usuario autenticado (cliente)
 * @access  Private - All authenticated users, but clients can only see their own invoices
 */
router.get('/', 
  authenticate,
  validateQuery(schemas.getFacturas),
  (req, res) => {
    // Mock data para el Flujo 2
    
    // Datos de facturas simuladas
    const todasFacturas = [
      {
        id: "factura1",
        usuarioId: "72695c8a-d2c8-4091-8f7f-7d45f274fc49", // ID del admin
        estado: "Pendiente",
        monto: 1500,
        fechaEmision: "2025-03-10T08:30:00Z",
        fechaPago: null
      },
      {
        id: "factura2",
        usuarioId: "9b1098c5-b865-4f4f-9c01-f85bfc6dadc6", // ID de un cliente
        estado: "Pagado",
        monto: 2500,
        fechaEmision: "2025-03-12T14:45:00Z",
        fechaPago: "2025-03-14T09:20:00Z"
      },
      {
        id: "factura3",
        usuarioId: "9b1098c5-b865-4f4f-9c01-f85bfc6dadc6", // ID de un cliente
        estado: "Pendiente",
        monto: 1800,
        fechaEmision: "2025-03-18T11:15:00Z",
        fechaPago: null
      },
      {
        id: "factura4",
        usuarioId: "73d7c990-813c-4cc1-82b6-9d51fc4c4a6f", // ID de otro cliente
        estado: "Vencido",
        monto: 3200,
        fechaEmision: "2025-02-28T16:30:00Z",
        fechaPago: null
      }
    ];
    
    let facturas;
    
    // Filtrar por usuario si es cliente
    if (req.user.role === 'Administrador') {
      facturas = todasFacturas;
    } else {
      // Si es cliente, solo muestra sus facturas
      facturas = todasFacturas.filter(factura => factura.usuarioId === req.user.id);
    }
    
    // Filtrar por estado si se proporciona en la consulta
    if (req.query.estado) {
      facturas = facturas.filter(factura => factura.estado === req.query.estado);
    }
    
    res.status(200).json(facturas);
  }
);

/**
 * @route   GET /facturas/:id
 * @desc    Obtiene una factura específica por ID
 * @access  Private - Admin or invoice owner
 */
router.get('/:id', 
  isInvoiceOwnerOrAdmin,
  validateParams(schemas.getFacturaById),
  (req, res) => {
    // Mock data para el Flujo 2
    const facturaId = req.params.id;
    
    // Datos de facturas simuladas
    const facturas = {
      "factura1": {
        id: "factura1",
        usuarioId: "72695c8a-d2c8-4091-8f7f-7d45f274fc49", // ID del admin
        estado: "Pendiente",
        monto: 1500,
        fechaEmision: "2025-03-10T08:30:00Z",
        fechaPago: null
      },
      "factura2": {
        id: "factura2",
        usuarioId: "9b1098c5-b865-4f4f-9c01-f85bfc6dadc6", // ID de un cliente
        estado: "Pagado",
        monto: 2500,
        fechaEmision: "2025-03-12T14:45:00Z",
        fechaPago: "2025-03-14T09:20:00Z"
      },
      "factura3": {
        id: "factura3",
        usuarioId: "9b1098c5-b865-4f4f-9c01-f85bfc6dadc6", // ID de un cliente
        estado: "Pendiente",
        monto: 1800,
        fechaEmision: "2025-03-18T11:15:00Z",
        fechaPago: null
      },
      "factura4": {
        id: "factura4",
        usuarioId: "73d7c990-813c-4cc1-82b6-9d51fc4c4a6f", // ID de otro cliente
        estado: "Vencido",
        monto: 3200,
        fechaEmision: "2025-02-28T16:30:00Z",
        fechaPago: null
      }
    };
    
    // Buscar la factura
    const factura = facturas[facturaId];
    
    if (!factura) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: `Factura con ID ${facturaId} no encontrada`
      });
    }
    
    // Verificar acceso
    if (req.user.role !== 'Administrador' && factura.usuarioId !== req.user.id) {
      return res.status(403).json({
        success: false,
        status: 403,
        message: "No tiene permiso para acceder a esta factura"
      });
    }
    
    // Devolver la factura
    res.status(200).json(factura);
  }
);

/**
 * @route   PATCH /facturas/:id
 * @desc    Actualiza el estado de una factura
 * @access  Private - Admin only
 */
router.patch('/:id', 
  authenticate, isAdmin,
  validateParams(schemas.getFacturaById),
  validate(schemas.updateFacturaEstado),
  (req, res) => {
    res.header('Connection', 'close');
    // Mock data para el Flujo 2
    const facturaId = req.params.id;
    const { estado } = req.body;
    
    // Datos de facturas simuladas
    const facturas = {
      "factura1": {
        id: "factura1",
        usuarioId: "72695c8a-d2c8-4091-8f7f-7d45f274fc49", // ID del admin
        estado: "Pendiente",
        monto: 1500,
        fechaEmision: "2025-03-10T08:30:00Z",
        fechaPago: null
      },
      "factura2": {
        id: "factura2",
        usuarioId: "9b1098c5-b865-4f4f-9c01-f85bfc6dadc6", // ID de un cliente
        estado: "Pagado",
        monto: 2500,
        fechaEmision: "2025-03-12T14:45:00Z",
        fechaPago: "2025-03-14T09:20:00Z"
      },
      "factura3": {
        id: "factura3",
        usuarioId: "9b1098c5-b865-4f4f-9c01-f85bfc6dadc6", // ID de un cliente
        estado: "Pendiente",
        monto: 1800,
        fechaEmision: "2025-03-18T11:15:00Z",
        fechaPago: null
      },
      "factura4": {
        id: "factura4",
        usuarioId: "73d7c990-813c-4cc1-82b6-9d51fc4c4a6f", // ID de otro cliente
        estado: "Vencido",
        monto: 3200,
        fechaEmision: "2025-02-28T16:30:00Z",
        fechaPago: null
      }
    };
    
    // Buscar la factura
    const factura = facturas[facturaId];
    
    if (!factura) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: `Factura con ID ${facturaId} no encontrada`
      });
    }
    
    // Actualizar el estado
    factura.estado = estado;
    
    // Si se marca como pagada, actualizar la fecha de pago
    if (estado === 'Pagado' && factura.fechaPago === null) {
      factura.fechaPago = new Date().toISOString();
    }
    
    // Devolver la factura actualizada
    res.status(200).json(factura);
  }
);

/**
 * @route   POST /facturas
 * @desc    Crear una nueva factura
 * @access  Private - Admin only
 */
router.post('/',
  authenticate, isAdmin,
  validate(schemas.createFactura),
  (req, res) => {
    const { usuarioId, monto, estado } = req.body;
    
    // Simular creación de nueva factura
    const nuevaFactura = {
      id: `factura${Date.now()}`,
      usuarioId,
      estado,
      monto,
      fechaEmision: new Date().toISOString(),
      fechaPago: estado === 'Pagado' ? new Date().toISOString() : null
    };
    
    // Devolver la factura creada
    res.status(201).json({
      success: true,
      message: 'Factura creada exitosamente',
      factura: nuevaFactura
    });
  }
);

/**
 * @route   DELETE /facturas/:id
 * @desc    Eliminar una factura (soft delete)
 * @access  Private - Admin only
 */
router.delete('/:id',
  authenticate, isAdmin,
  validateParams(schemas.getFacturaById),
  (req, res) => {
    // Mock data para API testing
    const facturaId = req.params.id;
    
    const facturas = {
      "factura1": {
        id: "factura1",
        usuarioId: "72695c8a-d2c8-4091-8f7f-7d45f274fc49",
        estado: "Pendiente",
        monto: 1500,
        fechaEmision: "2025-03-10T08:30:00Z",
        fechaPago: null
      },
      "factura2": {
        id: "factura2",
        usuarioId: "9b1098c5-b865-4f4f-9c01-f85bfc6dadc6",
        estado: "Pagado",
        monto: 2500,
        fechaEmision: "2025-03-12T14:45:00Z",
        fechaPago: "2025-03-14T09:20:00Z"
      },
      "factura3": {
        id: "factura3",
        usuarioId: "9b1098c5-b865-4f4f-9c01-f85bfc6dadc6",
        estado: "Pendiente",
        monto: 1800,
        fechaEmision: "2025-03-18T11:15:00Z",
        fechaPago: null
      }
    };
    
    // Buscar la factura
    const factura = facturas[facturaId];
    
    if (!factura) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: `Factura con ID ${facturaId} no encontrada`
      });
    }
    
    // No se puede eliminar una factura pagada
    if (factura.estado === 'Pagado') {
      return res.status(400).json({
        success: false,
        status: 400,
        message: 'No se puede eliminar una factura en estado Pagado'
      });
    }
    
    // aquí se realizaría un soft delete
    
    res.status(204).send();
  }
);

module.exports = router;

