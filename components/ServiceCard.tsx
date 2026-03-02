import React from 'react';
import { Service } from '../types.ts';

interface ServiceCardProps {
  service: Service;
  lang: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100 flex flex-col hover:-translate-y-2">
      <div className="aspect-[4/3] overflow-hidden relative">
        <img
          src={service.image}
          alt={service.title}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>

        <div className="absolute top-4 left-4 w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-2xl z-10 transition-transform group-hover:scale-110">
          {service.icon}
        </div>
      </div>

      <div className="p-8 flex-grow flex flex-col relative bg-white z-10">
        <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-amber-600 transition-colors">
          {service.title}
        </h3>

        <p className="text-slate-600 leading-relaxed mb-3">{service.description}</p>
        <p className="text-slate-700 leading-relaxed text-sm">{service.longDescription}</p>
      </div>

      <div className="absolute bottom-0 left-0 h-1 bg-amber-500 w-0 group-hover:w-full transition-all duration-700 ease-in-out"></div>
    </div>
  );
};

export default ServiceCard;
