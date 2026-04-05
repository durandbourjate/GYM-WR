import { useContext } from 'react'
import { LernKontextContext } from '../../context/lernen/LernKontextProvider'
export function useLernKontext() { return useContext(LernKontextContext) }
