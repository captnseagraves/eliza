#!/bin/bash
export DATABASE_URL=postgresql://kevinseagraves@localhost:5432/dinewell
npx prisma db push
