// --- WEATHER WIDGET COMPONENT ---
const DESTINATIONS_COORDS = {
  "Torres del Paine": { lat: -51.25, lon: -72.35 },
  "Puerto Varas": { lat: -41.32, lon: -72.98 },
  "Chiloé": { lat: -42.48, lon: -73.76 },
  "Pucón": { lat: -39.27, lon: -71.98 },
  "Valdivia": { lat: -39.81, lon: -73.24 }
};

// Mapeo básico de códigos de clima (WMO) a emojis
const getWeatherEmoji = (code) => {
  if (code === 0) return '☀️'; // Despejado
  if (code >= 1 && code <= 3) return '⛅'; // Parcialmente nublado
  if (code >= 45 && code <= 48) return '🌫️'; // Niebla
  if (code >= 51 && code <= 67) return '🌧️'; // Lluvia
  if (code >= 71 && code <= 77) return '❄️'; // Nieve
  if (code >= 80 && code <= 82) return '🌦️'; // Chubascos
  if (code >= 95 && code <= 99) return '⛈️'; // Tormenta
  return '☁️';
};

function WeatherWidget({ destino }) {
  const [weatherData, setWeatherData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const coords = DESTINATIONS_COORDS[destino];
    if (!coords) {
      setError("Destino no encontrado");
      setLoading(false);
      return;
    }

    const fetchWeather = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&forecast_days=3`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Error en la red al obtener clima");
        const data = await response.json();

        // Formatear datos
        const days = data.daily.time.map((date, index) => {
          const d = new Date(date + 'T00:00:00'); // Evitar problemas de zona horaria local
          const dayName = d.toLocaleDateString('es-ES', { weekday: 'short' });
          return {
            date: date,
            dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
            max: Math.round(data.daily.temperature_2m_max[index]),
            min: Math.round(data.daily.temperature_2m_min[index]),
            code: data.daily.weathercode[index]
          };
        });

        setWeatherData(days);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar el clima");
        setLoading(false);
      }
    };

    fetchWeather();
  }, [destino]);

  if (loading) return <div className="weather-widget loading">Cargando clima...</div>;
  if (error) return <div className="weather-widget error">{error}</div>;

  return (
    <div className="weather-widget">
      <p className="weather-title">Pronóstico </p>
      <div className="weather-days-container">
        {weatherData.map((day, idx) => (
          <div key={idx} className="weather-day">
            <span className="w-day-name">{day.dayName}</span>
            <span className="w-icon">{getWeatherEmoji(day.code)}</span>
            <span className="w-temps">
              <span className="w-max">{day.max}°</span>
              <span className="w-min">{day.min}°</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- POSTS CRUD COMPONENT ---

// Función básica para sanitizar inputs (evitar XSS básico en inyección manual)
const sanitizeInput = (input) => {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

function PostManager() {
  const [posts, setPosts] = React.useState([]);
  const [formData, setFormData] = React.useState({ id: null, title: '', content: '', author: '' });
  const [errorMsg, setErrorMsg] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);

  // Cargar datos (Fetch inicial simulado + LocalStorage)
  React.useEffect(() => {
    const loadInitialData = async () => {
      const localData = localStorage.getItem('viajes_posts_v1');
      if (localData) {
        setPosts(JSON.parse(localData));
        setIsLoading(false);
      } else {
        // Demostrar manejo de errores con fetch trayendo datos dummy si no hay nada local
        try {
          const response = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=3');
          if (!response.ok) throw new Error("Error en el servidor al obtener posts iniciales");
          const dummyData = await response.json();

          const formattedData = dummyData.map(d => ({
            id: Date.now() + Math.random(),
            title: d.title.substring(0, 25),
            content: d.body.substring(0, 80) + '...',
            author: 'Viajero Anónimo',
            date: new Date().toLocaleDateString()
          }));

          setPosts(formattedData);
          localStorage.setItem('viajes_posts_v1', JSON.stringify(formattedData));
        } catch (err) {
          console.error("Fetch fallido:", err);
          setErrorMsg("Error cargando posts iniciales. Por favor, crea uno nuevo.");
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadInitialData();
  }, []);

  // Guardar en LocalStorage cada vez que cambian los posts
  React.useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('viajes_posts_v1', JSON.stringify(posts));
    }
  }, [posts, isLoading]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validación de campos vacíos
    if (!formData.title.trim() || !formData.content.trim() || !formData.author.trim()) {
      setErrorMsg('Todos los campos son obligatorios.');
      return;
    }

    const newPost = {
      id: formData.id || Date.now(),
      title: sanitizeInput(formData.title),
      content: sanitizeInput(formData.content),
      author: sanitizeInput(formData.author),
      date: new Date().toLocaleDateString()
    };

    if (formData.id) {
      // Actualizar post existente
      setPosts(posts.map(p => p.id === formData.id ? newPost : p));
    } else {
      // Crear nuevo
      setPosts([newPost, ...posts]);
    }

    // Limpiar formulario
    setFormData({ id: null, title: '', content: '', author: '' });
  };

  const handleEdit = (post) => {
    setFormData(post);
    document.getElementById('post-form-section').scrollIntoView({ behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta experiencia?')) {
      setPosts(posts.filter(p => p.id !== id));
    }
  };

  return (
    <div className="container py-5 react-posts-container">
      <div className="section-title centered mb-5">
        <p className="mini-title">Comunidad</p>
        <h2>Experiencias de Viajeros</h2>
        <p className="section-subtext">Comparte tu experiencia o lee lo que otros dicen de sus escapadas al sur.</p>
      </div>

      <div className="row" id="post-form-section">
        <div className="col-md-4 mb-4">
          <div className="card-custom form-card p-4">
            <h4 className="mb-3">{formData.id ? 'Editar Experiencia' : 'Compartir Experiencia'}</h4>
            {errorMsg && <div className="alert-error mb-3">{errorMsg}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group mb-3">
                <label className="form-label">Tu Nombre</label>
                <input
                  type="text"
                  className="form-control"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  placeholder="Ej. María"
                />
              </div>
              <div className="form-group mb-3">
                <label className="form-label">Título</label>
                <input
                  type="text"
                  className="form-control"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Ej. Un día increíble"
                />
              </div>
              <div className="form-group mb-4">
                <label className="form-label">Tu Experiencia</label>
                <textarea
                  className="form-control"
                  name="content"
                  rows="6"
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="Cuenta cómo te fue..."
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary w-100">
                {formData.id ? 'Guardar Cambios' : 'Publicar'}
              </button>
              {formData.id && (
                <button
                  type="button"
                  className="btn btn-secondary w-100 mt-2"
                  onClick={() => setFormData({ id: null, title: '', content: '', author: '' })}
                >
                  Cancelar
                </button>
              )}
            </form>
          </div>
        </div>

        <div className="col-md-8">
          <div className="row">
            {isLoading ? (
              <div className="col-12 text-center">Cargando experiencias...</div>
            ) : posts.length === 0 ? (
              <div className="col-12 text-center text-muted">Aún no hay experiencias publicadas. ¡Sé el primero!</div>
            ) : (
              posts.map(post => (
                <div key={post.id} className="col-md-6 mb-4">
                  <div className="card-custom post-card p-4 h-100 d-flex flex-column">
                    <h5 className="post-title">{post.title}</h5>
                    <p className="post-author-date">Por {post.author} el {post.date}</p>
                    <p className="post-content flex-grow-1">{post.content}</p>
                    <div className="post-actions mt-3">
                      <button className="btn-sm edit-btn" onClick={() => handleEdit(post)}>Editar</button>
                      <button className="btn-sm delete-btn" onClick={() => handleDelete(post.id)}>Eliminar</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- RENDERIZADO INICIAL ---

// Renderizar Widgets de Clima
document.querySelectorAll('.react-weather-root').forEach(domContainer => {
  const destino = domContainer.getAttribute('data-destino');
  const root = ReactDOM.createRoot(domContainer);
  root.render(<WeatherWidget destino={destino} />);
});

// Renderizar Posts CRUD
const postsContainer = document.getElementById('react-posts-root');
if (postsContainer) {
  const root = ReactDOM.createRoot(postsContainer);
  root.render(<PostManager />);
}
