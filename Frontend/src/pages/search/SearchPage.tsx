// src/pages/search/SearchPage.tsx
import React, { useState, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonSearchbar, IonList, IonItem, IonLabel, IonChip,
  IonButtons, IonButton, IonIcon, IonSelect, IonSelectOption,
  IonText, IonBackButton, IonLoading, IonSkeletonText
} from '@ionic/react';
import { logOutOutline, filterOutline, closeCircleOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import api from '../../services/api';

interface Tramite {
  id_tramite: number;
  id_usuario: number;
  nombre_estado: string;
  nombre_tipo: string;
  fecha_actualizacion: string;
}

const ESTADOS = ['Todos', 'Pendiente', 'En Proceso', 'Aprobado', 'Rechazado'];
const TIPOS = ['Todos', 'Patente', 'Permiso', 'Certificado', 'Licencia'];

const SearchPage: React.FC = () => {
  const history = useHistory();
  const [query, setQuery] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('Todos');
  const [tipoFiltro, setTipoFiltro] = useState('Todos');
  const [tramites, setTramites] = useState<Tramite[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchTramites = async () => {
      try {
        const res = await api.get('/tramites', {
          params: {
            estado: estadoFiltro,
            tipo: tipoFiltro
          }
        });
        setTramites(res.data);
      } catch (error) {
        console.error('Error al cargar trámites:', error);
      } finally {
        setCargando(false);
      }
    };
    fetchTramites();
  }, [estadoFiltro, tipoFiltro]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const filtrados = tramites.filter((t) => {
    const nombreDisplay = `${t.nombre_tipo} #${t.id_tramite}`;
    return nombreDisplay.toLowerCase().includes(query.toLowerCase());
  });

  const getEstadoColor = (estado: string) => {
    const map: Record<string, string> = {
      Aprobado: 'success', Pendiente: 'warning', 'En Proceso': 'primary', Rechazado: 'danger',
    };
    return map[estado] || 'medium';
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/dashboard" text="Volver" />
          </IonButtons>
          <IonTitle>Búsqueda y Filtrado</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" color="danger" onClick={handleLogout}>
              <IonIcon slot="start" icon={logOutOutline} />
              Cerrar Sesión
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {cargando && (
          <IonList>
            {[1, 2, 3, 4].map(i => (
              <IonItem key={i}>
                <IonLabel>
                  <h2><IonSkeletonText animated style={{ width: '50%' }} /></h2>
                  <p><IonSkeletonText animated style={{ width: '30%' }} /></p>
                </IonLabel>
                <IonSkeletonText animated style={{ width: '60px', height: '20px' }} slot="end" />
              </IonItem>
            ))}
          </IonList>
        )}

        {!cargando && (
          <>
            <IonSearchbar value={query} onIonChange={(e) => setQuery(e.detail.value!)} placeholder="Buscar trámite..." showClearButton="focus" />

            <div className="filter-row" style={{ display: 'flex', padding: '0 10px' }}>
              <IonIcon icon={filterOutline} style={{ fontSize: '24px', alignSelf: 'center' }} />
              <IonSelect value={estadoFiltro} onIonChange={(e) => setEstadoFiltro(e.detail.value)} placeholder="Estado" interface="popover">
                {ESTADOS.map((e) => <IonSelectOption key={e} value={e}>{e}</IonSelectOption>)}
              </IonSelect>
              <IonSelect value={tipoFiltro} onIonChange={(e) => setTipoFiltro(e.detail.value)} placeholder="Tipo" interface="popover">
                {TIPOS.map((t) => <IonSelectOption key={t} value={t}>{t}</IonSelectOption>)}
              </IonSelect>
            </div>

            {filtrados.length === 0 ? (
              <div className="empty-state" style={{ textAlign: 'center', marginTop: '50px', padding: '20px' }}>
                <IonIcon icon={closeCircleOutline} style={{ fontSize: '64px', color: '#ccc' }} />
                <IonText color="medium">
                  <p style={{ fontSize: '1.2rem', marginTop: '10px' }}>No se encontraron resultados para tu búsqueda</p>
                </IonText>
                <IonButton fill="clear" onClick={() => {setQuery(''); setEstadoFiltro('Todos'); setTipoFiltro('Todos');}}>
                  Limpiar filtros
                </IonButton>
              </div>
            ) : (
              <IonList>
                {filtrados.map((t) => (
                  <IonItem key={t.id_tramite} button onClick={() => history.push(`/roadmap/${t.id_tramite}`)}>
                    <IonLabel>
                      <h2 style={{ fontWeight: '600' }}>{t.nombre_tipo} #{t.id_tramite}</h2>
                      <p>Actualizado: {new Date(t.fecha_actualizacion).toLocaleDateString()}</p>
                    </IonLabel>
                    <IonChip color={getEstadoColor(t.nombre_estado)} slot="end">{t.nombre_estado}</IonChip>
                  </IonItem>
                ))}
              </IonList>
            )}
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default SearchPage;
