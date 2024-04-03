#!/bin/bash
source settings

MRG_MPATH="$MRG_MATERIALIZATION.$MRG_EXPERIMENT.$MRG_PROJECT"

mrg nodes generate inventory $MRG_MPATH > mrg_hosts
mrg nodes generate etchosts $MRG_MPATH > mrg_etchosts
