import React, { useState, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonIcon, IonButton,
  IonButtons, IonBackButton, IonLoading, IonBadge, IonRefresher, IonRefresherContent
} from '@ionic/react';
import { notificationsOutline, checkmarkCircleOutline, trashOutline } from 'ionicons/icons';
import api from '../../services/api';

interface NotificacionDB {
  id_notificacion: number;
  id_usuario: number;
  mensaje: string;
  leida: boolean;
  fecha_notificacion: string;
}

const NotificationsPage: React.FC = () => {
  const [notificaciones, setNotificaciones] = useState<NotificacionDB[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get(`/notificaciones/${user.id}`);
      setNotificaciones(res.data);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.put(`/notificaciones/${id}/leer`);
      setNotificaciones(prev => 
        prev.map(n => n.id_notificacion === id ? { ...n, leida: true } : n)
      );
    } catch (error) {
      console.error('Error al marcar como leída:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/notificaciones/${id}`);
      setNotificaciones(prev => prev.filter(n => n.id_notificacion !== id));
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
    }
  };

  const doRefresh = async (event: any) => {
    await fetchNotifications();
    event.detail.complete();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/dashboard" text="Volver" />
          </IonButtons>
          <IonTitle>Notificaciones</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonRefresher slot="fixed" onIonRefresh={doRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <IonLoading isOpen={cargando} message="Cargando notificaciones..." />

        <IonList>
          {notificaciones.length > 0 ? (
            notificaciones.map((n) => (
              <IonItem key={n.id_notificacion} className={n.leida ? '' : 'ion-color-light'}>
                <IonIcon 
                  icon={notificationsOutline} 
                  slot="start" 
                  color={n.leida ? 'medium' : 'primary'} 
                />
                <IonLabel>
                  <p>{new Date(n.fecha_notificacion).toLocaleString()}</p>
                  <h2 style={{ whiteSpace: 'normal' }}>{n.mensaje}</h2>
                </IonLabel>
                <IonButtons slot="end">
                  {!n.leida && (
                    <IonButton color="success" onClick={() => handleMarkAsRead(n.id_notificacion)}>
                      <IonIcon slot="icon-only" icon={checkmarkCircleOutline} />
                    </IonButton>
                  )}
                  <IonButton color="danger" onClick={() => handleDelete(n.id_notificacion)}>
                    <IonIcon slot="icon-only" icon={trashOutline} />
                  </IonButton>
                </IonButtons>
                {!n.leida && <IonBadge color="primary" slot="end">Nueva</IonBadge>}
              </IonItem>
            ))
          ) : (
            <IonItem lines="none">
              <IonLabel className="ion-text-center">No tienes notificaciones</IonLabel>
            </IonItem>
          )}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default NotificationsPage;
