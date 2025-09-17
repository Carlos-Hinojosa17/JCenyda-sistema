import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/apiServices';

export default function Principal() {
    const [metrics, setMetrics] = useState({
        ventas: 0,
        productos: 0,
        clientes: 0,
        stockBajo: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadMetrics();
    }, []);

    const loadMetrics = async () => {
        try {
            setLoading(true);
            const data = await dashboardService.getMetrics();
            setMetrics(data);
            setError('');
        } catch (error) {
            setError(error.message || 'Error al cargar métricas');
            console.error('Error loading metrics:', error);
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className='container-fluid'>
            <h2 className='mb-4'>Dashboard Principal</h2>
            
            {error && (
                <div className='alert alert-warning' role='alert'>
                    {error}
                </div>
            )}
            
            <div className='row'>
                <div className='col-md-3'>
                    <div className='card text-white bg-primary'>
                        <div className='card-body'>
                            <h5 className='card-title'>
                                <i className='bi bi-cart me-2'></i>Ventas
                            </h5>
                            <h3>
                                {loading ? (
                                    <span className='spinner-border spinner-border-sm'></span>
                                ) : (
                                    metrics.ventas || 0
                                )}
                            </h3>
                        </div>
                    </div>
                </div>
                <div className='col-md-3'>
                    <div className='card text-white bg-success'>
                        <div className='card-body'>
                            <h5 className='card-title'>
                                <i className='bi bi-box me-2'></i>Productos
                            </h5>
                            <h3>
                                {loading ? (
                                    <span className='spinner-border spinner-border-sm'></span>
                                ) : (
                                    metrics.productos || 0
                                )}
                            </h3>
                        </div>
                    </div>
                </div>
                <div className='col-md-3'>
                    <div className='card text-white bg-info'>
                        <div className='card-body'>
                            <h5 className='card-title'>
                                <i className='bi bi-people me-2'></i>Clientes
                            </h5>
                            <h3>
                                {loading ? (
                                    <span className='spinner-border spinner-border-sm'></span>
                                ) : (
                                    metrics.clientes || 0
                                )}
                            </h3>
                        </div>
                    </div>
                </div>
                <div className='col-md-3'>
                    <div className='card text-white bg-warning'>
                        <div className='card-body'>
                            <h5 className='card-title'>
                                <i className='bi bi-exclamation-triangle me-2'></i>Stock Bajo
                            </h5>
                            <h3>
                                {loading ? (
                                    <span className='spinner-border spinner-border-sm'></span>
                                ) : (
                                    metrics.stockBajo || 0
                                )}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
