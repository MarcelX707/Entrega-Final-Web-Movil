// src/pages/dashboard/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonGrid, IonRow, IonCol, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonIcon, IonButton, IonButtons, IonBadge,
} from '@ionic/react';
import {
  searchOutline, documentTextOutline, mapOutline,
  folderOutline, personOutline, logOutOutline, notificationsOutline,
  settingsOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const history = useHistory();

  const [nombreUsuario, setNombreUsuario] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setNombreUsuario(user.nombre || '');
      setRole(user.role || '');
    }
  }, []);

  const menuCards = [
    { label: 'Gestión de Perfil', path: '/profile', icon: personOutline, color: 'primary' },
    { label: 'Búsqueda y Filtrado', path: '/search', icon: searchOutline, color: 'secondary' },
    { label: 'Notificaciones', path: '/notifications', icon: notificationsOutline, color: 'danger' },
    { label: 'Reportes y Exportación', path: '/reports', icon: documentTextOutline, color: 'tertiary' },
    { label: 'Hoja de Ruta Dinámica', path: '/roadmap/1', icon: mapOutline, color: 'success' },
    { label: 'Repositorio Documental', path: '/documents', icon: folderOutline, color: 'warning' },
  ];

  // Si es admin, agregamos el acceso al panel de administración
  if (role === 'admin') {
    menuCards.push({ label: 'Panel de Administración', path: '/admin/dashboard', icon: settingsOutline, color: 'dark' });
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            {nombreUsuario ? `Hola, ${nombreUsuario}` : 'Bienvenido'}
            {role === 'admin' && <IonBadge color="danger" style={{ marginLeft: '10px' }}>Admin</IonBadge>}
          </IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" color="danger" onClick={handleLogout}>
              <IonIcon slot="start" icon={logOutOutline} />
              Cerrar Sesión
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="dashboard-content">
        <IonGrid>
          <IonRow>
            {menuCards.map((card) => (
              <IonCol key={card.path} size="12" sizeMd="6" sizeLg="4">
                <IonCard button onClick={() => history.push(card.path)} className="dashboard-card">
                  <IonCardHeader>
                    <IonIcon icon={card.icon} color={card.color} size="large" />
                    <IonCardTitle>{card.label}</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    Accede a {card.label.toLowerCase()}
                  </IonCardContent>
                </IonCard>
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default DashboardPage;
