const express = require('express');
const router = express.Router();
const { validateQuery, validateParams, schemas } = require('../utils/validationMiddleware');
const { authenticatedForVideos, isAdmin } = require('../utils/authMiddleware');

/**
 * @route   GET /videos
 * @desc    Obtener listado de videos con filtros opcionales
 * @access  Private - Any authenticated user
 */
router.get('/', 
  authenticatedForVideos,
  validateQuery(schemas.getVideos),
  (req, res) => {
    // Mock data para el Flujo 1    
    const videos = [
      {
        id: "video1",
        titulo: "Introducción a las APIs REST",
        descripcion: "Aprende los fundamentos de las APIs REST",
        genero: "Educación"
      },
      {
        id: "video2",
        titulo: "Tutorial de Node.js",
        descripcion: "Desarrollo con Node.js y Express",
        genero: "Tecnología"
      },
      {
        id: "video3",
        titulo: "Arquitectura Monolítica Modular",
        descripcion: "Ventajas de la arquitectura monolítica modular",
        genero: "Educación"
      }
    ];
    
    let filteredVideos = [...videos];
    
    if (req.query.titulo) {
      const tituloQuery = req.query.titulo.toLowerCase();
      filteredVideos = filteredVideos.filter(video => 
        video.titulo.toLowerCase().includes(tituloQuery)
      );
    }
    
    if (req.query.genero) {
      const generoQuery = req.query.genero.toLowerCase();
      filteredVideos = filteredVideos.filter(video => 
        video.genero.toLowerCase().includes(generoQuery)
      );
    }
    
    res.status(200).json(filteredVideos);
  }
);

/**
 * @route   GET /videos/:id
 * @desc    Obtener un video específico por ID
 * @access  Private - Any authenticated user
 */
router.get('/:id', 
  authenticatedForVideos,
  validateParams(schemas.getVideoById),
  (req, res) => {
    // Placeholder para el Flujo 1
    
    const videoId = req.params.id;
    
    const videos = {
      "video1": {
        id: "video1",
        titulo: "Introducción a las APIs REST",
        descripcion: "Aprende los fundamentos de las APIs REST",
        genero: "Educación"
      },
      "video2": {
        id: "video2",
        titulo: "Tutorial de Node.js",
        descripcion: "Desarrollo con Node.js y Express",
        genero: "Tecnología"
      },
      "video3": {
        id: "video3",
        titulo: "Arquitectura Monolítica Modular",
        descripcion: "Ventajas de la arquitectura monolítica modular",
        genero: "Educación"
      }
    };
    
    // Buscar el video por ID
    const video = videos[videoId];
    
    if (!video) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: `Video con ID ${videoId} no encontrado`
      });
    }
    
    // Devolver el video encontrado
    res.status(200).json(video);
  }
);

/**
 * @route   POST /videos
 * @desc    Create a new video
 * @access  Private - Admin only
 */
router.post('/',
  authenticatedForVideos,
  isAdmin,
  (req, res) => {
    // Implementación simplificada para demo
    res.status(501).json({ 
      success: false,
      message: "Endpoint not implemented" 
    });
  }
);

/**
 * @route   PATCH /videos/:id
 * @desc    Update a video
 * @access  Private - Admin only
 */
router.patch('/:id',
  authenticatedForVideos,
  isAdmin,
  (req, res) => {
    res.status(501).json({ 
      success: false,
      message: "Endpoint not implemented" 
    });
  }
);

/**
 * @route   DELETE /videos/:id
 * @desc    Delete a video (soft delete)
 * @access  Private - Admin only
 */
router.delete('/:id',
  authenticatedForVideos,
  isAdmin,
  (req, res) => {
    res.status(501).json({ 
      success: false,
      message: "Endpoint not implemented" 
    });
  }
);

module.exports = router;

