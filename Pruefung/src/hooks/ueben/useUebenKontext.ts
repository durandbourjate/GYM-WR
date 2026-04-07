import { useContext } from 'react'
import { UebenKontextContext } from '../../context/ueben/UebenKontextProvider'
export function useUebenKontext() { return useContext(UebenKontextContext) }
