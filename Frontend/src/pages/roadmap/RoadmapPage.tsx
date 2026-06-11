// src/pages/roadmap/RoadmapPage.tsx
import React, { useState, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonIcon, IonBadge, IonButton,
  IonButtons, IonGrid, IonRow, IonCol, IonCard, IonCardContent,
  IonText, IonBackButton, IonLoading
} from '@ionic/react';
import {
  checkmarkCircleOutline, timeOutline, ellipseOutline,
  addOutline, createOutline, gitBranchOutline, logOutOutline,
} from 'ionicons/icons';
import { useHistory, useParams } from 'react-router-dom';
import api from '../../services/api';

interface FaseDB {
  id_fase: number;
  id_tramite: number;
  nombre_tarea: string;
  estado_fase: string;
}

const getEstadoIcon = (estado: string) => {
  if (estado === 'completado') return checkmarkCircleOutline;
  if (estado === 'en_progreso') return timeOutline;
  return ellipseOutline;
};

const getEstadoColor = (estado: string) => {
  if (estado === 'completado') return 'success';
  if (estado === 'en_progreso') return 'primary';
  return 'medium';
};

const RoadmapPage: React.FC = () => {
  const history = useHistory();
  const { id } = useParams<{ id: string }>();
  const [fases, setFases] = useState<FaseDB[]>([]);
  const [cargando, setCargando] = useState(true);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const fetchFases = async () => {
      try {
        const res = await api.get(`/tramites/${id}/fases`);
        setFases(res.data);
      } catch (error) {
        console.error('Error al cargar fases:', error);
      } finally {
        setCargando(false);
      }
    };
    fetchFases();
  }, [id]);

  const handleUpdateFase = async (idFase: number, nuevoEstado: string) => {
    try {
      await api.put(`/fases/${idFase}`, { estado_fase: nuevoEstado });
      setFases(prev => prev.map(f => f.id_fase === idFase ? { ...f, estado_fase: nuevoEstado } : f));
    } catch (error) {
      console.error('Error al actualizar fase:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/search" text="Volver" />
          </IonButtons>
          <IonTitle>Hoja de Ruta - Trámite #{id}</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" color="danger" onClick={handleLogout}>
              <IonIcon icon={logOutOutline} />
              Cerrar Sesión
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonLoading isOpen={cargando} message="Cargando hoja de ruta..." />
        
        <IonGrid>
          <IonRow>
            <IonCol size="12" sizeMd="8">
              <IonList>
                {fases.length > 0 ? (
                  fases.map((paso, index) => (
                    <IonItem key={paso.id_fase} className="roadmap-item">
                      <IonIcon slot="start" icon={getEstadoIcon(paso.estado_fase)} color={getEstadoColor(paso.estado_fase)} size="large" />
                      <IonLabel>
                        <h2>{index + 1}. {paso.nombre_tarea}</h2>
                        {isAdmin && (
                          <div style={{ marginTop: '10px' }}>
                            <IonButton size="small" fill="outline" onClick={() => handleUpdateFase(paso.id_fase, 'completado')}>Completar</IonButton>
                            <IonButton size="small" fill="outline" onClick={() => handleUpdateFase(paso.id_fase, 'en_progreso')}>En Proceso</IonButton>
                            <IonButton size="small" fill="outline" onClick={() => handleUpdateFase(paso.id_fase, 'pendiente')}>Pendiente</IonButton>
                          </div>
                        )}
                      </IonLabel>
                      <IonBadge color={getEstadoColor(paso.estado_fase)} slot="end">
                        {paso.estado_fase.replace('_', ' ')}
                      </IonBadge>
                    </IonItem>
                  ))
                ) : (
                  !cargando && <IonItem><IonLabel className="ion-text-center">No hay fases registradas para este trámite</IonLabel></IonItem>
                )}
              </IonList>
            </IonCol>

            {isAdmin && (
              <IonCol size="12" sizeMd="4">
                <IonCard>
                  <IonCardContent>
                    <h3>Gestión Administrativa</h3>
                    <p>Como administrador puedes actualizar el estado de cada fase del trámite para informar al usuario.</p>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            )}
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default RoadmapPage;
