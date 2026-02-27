'use client'

import { useState } from 'react'

export function CatalogFilters() {
  const [filters, setFilters] = useState({
    location: [],
    age: [18, 45],
    services: [],
  })

  return (
    <div className="bg-muted/30 rounded-lg p-6 space-y-6">
      <h2 className="font-semibold text-lg">Filters</h2>

      {/* Location */}
      <div>
        <h3 className="font-medium mb-3">Location</h3>
        <div className="space-y-2">
          {['Mayfair', 'Kensington', 'Knightsbridge', 'Chelsea', 'Belgravia', 'Marylebone'].map((location) => (
            <label key={location} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" />
              <span className="text-sm">{location}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Age Range */}
      <div>
        <h3 className="font-medium mb-3">Age Range</h3>
        <div className="space-y-2">
          <input
            type="range"
            min="18"
            max="45"
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>18</span>
            <span>45</span>
          </div>
        </div>
      </div>

      {/* Hair Color */}
      <div>
        <h3 className="font-medium mb-3">Hair Color</h3>
        <div className="space-y-2">
          {['Blonde', 'Brunette', 'Black', 'Red'].map((color) => (
            <label key={color} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" />
              <span className="text-sm">{color}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Services */}
      <div>
        <h3 className="font-medium mb-3">Services</h3>
        <div className="space-y-2">
          {['Incall', 'Outcall', 'Duo', 'Overnight'].map((service) => (
            <label key={service} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" />
              <span className="text-sm">{service}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-4 border-t border-border">
        <button className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          Apply
        </button>
        <button className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors">
          Reset
        </button>
      </div>
    </div>
  )
}
