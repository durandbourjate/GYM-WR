import { useContext } from 'react'
import { UebenKontextContext } from '../../context/lernen/UebenKontextProvider'
export function useUebenKontext() { return useContext(UebenKontextContext) }
