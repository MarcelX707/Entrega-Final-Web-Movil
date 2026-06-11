// src/pages/documents/DocumentsPage.tsx
import React, { useState, useEffect } from 'react'; // <-- NUEVO: Importamos useEffect
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonIcon, IonBadge, IonButton,
  IonButtons, IonSearchbar, IonFab, IonFabButton,
  IonGrid, IonRow, IonCol, IonBackButton,
  IonLoading, IonSkeletonText
} from '@ionic/react';
import { documentOutline, downloadOutline, addOutline, folderOpenOutline, logOutOutline, trashOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { Documento } from '../../types';
import api from '../../services/api'; // <-- NUEVO: Importamos la conexión a tu backend

// NUEVO: Definimos cómo viene la carpeta desde tu PostgreSQL
interface CarpetaDB {
  id_carpeta: number;
  nombre_carpeta: string;
}

// NUEVO: Definimos cómo viene el documento desde tu PostgreSQL
interface DocumentoDB {
  id_documento: number;
  id_carpeta: number;
  nombre_archivo: string;
  fecha_subida: string;
  ruta_almacenamiento: string;
}

const DocumentsPage: React.FC = () => {
  const history = useHistory();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.role === 'admin';

  const [query, setQuery] = useState('');
  
  // NUEVO: Estados para manejar las carpetas reales de la Base de Datos
  const [carpetas, setCarpetas] = useState<CarpetaDB[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoDB[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  // FIX: estado de carpeta seleccionada. Puede ser el ID de la carpeta o 'Todos'
  const [carpetaActiva, setCarpetaActiva] = useState<number | 'Todos'>('Todos');

  // NUEVO: Esta función va a buscar las carpetas y documentos a tu servidor Node.js
  const fetchData = async () => {
    try {
      const [resCarpetas, resDocumentos] = await Promise.all([
        api.get('/carpetas'),
        api.get('/documentos')
      ]);
      setCarpetas(resCarpetas.data);
      setDocumentos(resDocumentos.data);
    } catch (error) {
      console.error('Error al cargar datos desde la API:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este documento?')) return;
    try {
      await api.delete(`/documentos/${id}`);
      setDocumentos(prev => prev.filter(d => d.id_documento !== id));
    } catch (error) {
      console.error('Error al eliminar documento:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const documentosFiltrados = documentos.filter(doc => {
    const coincideCarpeta = carpetaActiva === 'Todos' || doc.id_carpeta === carpetaActiva;
    const coincideBusqueda = doc.nombre_archivo.toLowerCase().includes(query.toLowerCase());
    return coincideCarpeta && coincideBusqueda;
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/dashboard" text="Volver" />
          </IonButtons>
          <IonTitle>Repositorio Documental</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleLogout}>
              <IonIcon slot="icon-only" icon={logOutOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        
        {/* NUEVO: Skeleton Screen en lugar de IonLoading para mejor UX */}
        {cargando && (
          <IonList>
            {[1, 2, 3, 4, 5].map((i) => (
              <IonItem key={i}>
                <IonIcon slot="start" icon={documentOutline} style={{ opacity: 0.3 }} />
                <IonLabel>
                  <h2><IonSkeletonText animated style={{ width: '60%' }} /></h2>
                  <p><IonSkeletonText animated style={{ width: '40%' }} /></p>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        )}

        {!cargando && (
          <>
            <IonSearchbar 
              value={query} 
              onIonInput={(e: any) => setQuery(e.target.value)} 
              placeholder="Buscar documento..." 
            />

            {/* Sección de Filtros por Carpeta */}
            <IonGrid>
              <IonRow>
                <IonCol size="auto">
                  <IonButton 
                    fill={carpetaActiva === 'Todos' ? 'solid' : 'outline'} 
                    onClick={() => setCarpetaActiva('Todos')}
                    size="small"
                  >
                    Todos
                  </IonButton>
                </IonCol>
                
                {carpetas.map(carpeta => (
                  <IonCol key={carpeta.id_carpeta} size="auto">
                    <IonButton 
                      fill={carpetaActiva === carpeta.id_carpeta ? 'solid' : 'outline'} 
                      onClick={() => setCarpetaActiva(carpeta.id_carpeta)}
                      size="small"
                    >
                      {carpeta.nombre_carpeta}
                    </IonButton>
                  </IonCol>
                ))}
              </IonRow>
            </IonGrid>

            {/* Lista de Documentos */}
            <IonList>
              {documentosFiltrados.length > 0 ? (
                documentosFiltrados.map((doc) => (
                  <IonItem key={doc.id_documento} className="animate__animated animate__fadeIn">
                    <IonIcon icon={documentOutline} slot="start" />
                    <IonLabel>
                      <h2>{doc.nombre_archivo}</h2>
                      <p>{new Date(doc.fecha_subida).toLocaleDateString()} - ID: {doc.id_documento}</p>
                    </IonLabel>
                    <IonButtons slot="end">
                      <IonButton fill="clear" onClick={() => window.open(doc.ruta_almacenamiento, '_blank')}>
                        <IonIcon slot="icon-only" icon={downloadOutline} />
                      </IonButton>
                      {isAdmin && (
                        <IonButton fill="clear" color="danger" onClick={() => handleDelete(doc.id_documento)}>
                          <IonIcon slot="icon-only" icon={trashOutline} />
                        </IonButton>
                      )}
                    </IonButtons>
                  </IonItem>
                ))
              ) : (
                <div className="ion-text-center ion-padding" style={{ marginTop: '20px' }}>
                  <IonIcon icon={folderOpenOutline} style={{ fontSize: '64px', color: '#ccc' }} />
                  <p style={{ color: '#999' }}>No se encontraron documentos</p>
                </div>
              )}
            </IonList>
          </>
        )}

        {/* Botón flotante solo para Administradores */}

        {/* Botón flotante solo para Administradores */}
        {isAdmin && (
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton onClick={() => history.push('/documents/new')}>
              <IonIcon icon={addOutline} />
            </IonFabButton>
          </IonFab>
        )}
      </IonContent>
    </IonPage>
  );
};

export default DocumentsPage;