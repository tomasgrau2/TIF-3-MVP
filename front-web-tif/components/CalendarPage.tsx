import React, { useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, EventProps } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import es from 'date-fns/locale/es';
import { Product, CalendarEventType } from '../types';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'es': es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
  // El localizador usará 'es' por defecto si el navegador está en español
});

interface CalendarPageProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

// Custom Event Component with improved styling
const CustomEvent: React.FC<EventProps<CalendarEventType>> = ({ event }) => {
  return (
    <div className="rbc-event-content p-1" title={`${event.product.name} - Lote: ${event.product.lotNumber}`}>
      <div className="font-semibold text-xs leading-tight truncate">{event.product.name}</div>
      <div className="text-xs opacity-80 leading-tight">Lote: {event.product.lotNumber}</div>
      <div className="text-xs opacity-80 leading-tight mt-1">
        {new Date(event.product.expiryDate).toLocaleDateString('es-ES')}
      </div>
    </div>
  );
};

// Función para capitalizar la primera letra
function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Componente para sobrescribir el encabezado de los días de la semana
const CustomWeekdayHeader = ({ label }: { label: string }) => (
  <span>{capitalize(label)}</span>
);

// Componente para sobrescribir el encabezado del mes en la toolbar
const viewLabels: Record<string, string> = {
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
};
const CustomToolbar = (toolbarProps: any) => {
  // Capitalizar el mes en la toolbar
  const label = toolbarProps.label.replace(/^(\w+)/, (m: string) => capitalize(m));
  return (
    <div className="rbc-toolbar">
      <span className="rbc-btn-group">
        <button type="button" onClick={() => toolbarProps.onNavigate('PREV')}>{'Anterior'}</button>
        <button type="button" onClick={() => toolbarProps.onNavigate('TODAY')}>{'Hoy'}</button>
        <button type="button" onClick={() => toolbarProps.onNavigate('NEXT')}>{'Siguiente'}</button>
      </span>
      <span className="rbc-toolbar-label">{label}</span>
      <span className="rbc-btn-group">
        {toolbarProps.views.map((view: string) => (
          <button
            type="button"
            key={view}
            className={toolbarProps.view === view ? 'rbc-active' : ''}
            onClick={() => toolbarProps.onView(view)}
          >
            {viewLabels[view] || view}
          </button>
        ))}
      </span>
    </div>
  );
};

const CalendarPage: React.FC<CalendarPageProps> = ({ products, onSelectProduct }) => {
  const events = useMemo<CalendarEventType[]>(() => {
    return products.map(product => {
      const expiryDate = new Date(product.expiryDate);
      return {
        title: product.name,
        start: expiryDate,
        end: expiryDate,
        allDay: true,
        product: product,
      };
    });
  }, [products]);

  const handleSelectEvent = useCallback((event: CalendarEventType) => {
    onSelectProduct(event.product);
  }, [onSelectProduct]);

  const eventPropGetter = useCallback((event: CalendarEventType) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(event.product.expiryDate);
    expiryDate.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    let className = 'rbc-event shadow-sm transition-all duration-200 hover:shadow-md';

    if (diffDays < 0) {
      className += ' bg-red-500 hover:bg-red-600 border-red-700'; // Vencido
    } else if (diffDays === 0) {
      className += ' bg-red-400 hover:bg-red-500 border-red-600'; // Vence Hoy
    } else if (diffDays <= 7) {
      className += ' bg-orange-400 hover:bg-orange-500 border-orange-600'; // Vence Pronto
    } else if (diffDays <= 30) {
      className += ' bg-yellow-400 hover:bg-yellow-500 border-yellow-600'; // Vence Cerca
    } else {
      className += ' bg-sky-500 hover:bg-sky-600 border-sky-700'; // Normal
    }
    return { className };
  }, []);

  const messages = {
    allDay: 'Todo el día',
    previous: 'Anterior',
    next: 'Siguiente',
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    date: 'Fecha',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'No hay eventos en este rango',
    showMore: (total: number) => `+ Ver más (${total})`,
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-xl h-full w-full">
      <style>
        {`
          .rbc-calendar {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
          }
          .rbc-header {
            padding: 10px 3px;
            font-weight: 600;
            color: #1e293b;
            background-color: #f8fafc;
            border-bottom: 2px solid #e2e8f0;
          }
          .rbc-today {
            background-color: #f1f5f9;
          }
          .rbc-event {
            border-radius: 4px;
            border: none;
            padding: 2px 4px;
            margin: 1px 0;
            color: #fff !important; /* Fuerza fuente blanca para todos los eventos */
          }
          .rbc-event.rbc-selected {
            box-shadow: none !important;
            outline: none !important;
            border: none !important;
          }
          .rbc-show-more {
            background-color: #f8fafc;
            color: #64748b;
            border-radius: 4px;
            padding: 2px 4px;
            font-size: 0.8em;
          }
          .rbc-toolbar {
            margin-bottom: 1.5rem;
          }
          .rbc-toolbar button {
            color: #1e293b;
            border: 1px solid #e2e8f0;
            padding: 6px 12px;
            border-radius: 6px;
            background-color: white;
            transition: all 0.2s;
          }
          .rbc-toolbar button:hover {
            background-color: #f1f5f9;
            border-color: #cbd5e1;
          }
          .rbc-toolbar button.rbc-active {
            background-color: #0ea5e9;
            color: white;
            border-color: #0284c7;
          }
          .rbc-toolbar-label {
            font-size: 1.25rem;
            font-weight: 600;
            color: #1e293b;
          }
          /* Forzar color de fuente blanco en la vista de lista (agenda) */
          .rbc-agenda-table .rbc-agenda-event-cell,
          .rbc-agenda-table .rbc-agenda-date-cell {
            color: #fff !important;
            background: #1e293b;
          }
          .rbc-event,
          .rbc-event * {
            color: #fff !important;
          }
        `}
      </style>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 'calc(100vh - 200px)' }}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventPropGetter}
        views={['month', 'week', 'day']}
        components={{
          event: CustomEvent,
          month: {
            header: CustomWeekdayHeader,
          },
          week: {
            header: CustomWeekdayHeader,
          },
          day: {
            header: CustomWeekdayHeader,
          },
          toolbar: CustomToolbar,
        }}
        messages={messages}
        popup
        selectable
        defaultView="month"
        className="rounded-lg overflow-hidden"
        culture="es"
      />
    </div>
  );
};

export default CalendarPage;