import React, { useState, useRef, useEffect } from 'react'
import { CHAIN_LOGOS } from '../config/chainLogos'
import '../styles/ChainSelect.css'

export default function ChainSelect({
  chains,
  value,
  onChange,
  placeholder = 'Select chain'
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef()

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedChain = chains.find((c) => c.chainId === value)

  return (
    <div className="chain-select" ref={ref}>
      <button
        className="chain-select__button"
        onClick={() => setOpen(!open)}
      >
        {selectedChain ? (
          <>
            <img
              src={CHAIN_LOGOS[selectedChain.key] || '/logo/default.png'}
              alt=""
              className="chain-select__icon"
            />
            <span>{selectedChain.name}</span>
          </>
        ) : (
          <span className="chain-select__placeholder">{placeholder}</span>
        )}
        <span className="chain-select__chevron">▾</span>
      </button>

      {open && (
        <div className="chain-select__dropdown">
          {chains.map((c) => (
            <div
              key={c.chainId}
              className="chain-select__item"
              onClick={() => {
                onChange(c.chainId)
                setOpen(false)
              }}
            >
              <img
                src={CHAIN_LOGOS[c.key] || '/logo/default.png'}
                alt=""
                className="chain-select__icon"
              />
              <span>{c.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}








