# Distributed Algorithms
* These notes are based on the EPFL CS-453 Concurrent Algorithms course given in Autumn 2022 by Prof. Guerraoui.
* [Course Website]()
* The course follows the book [**]() by , .

## Overview
1. Introduction

## Causal Broadcast

Events
* Request: <coBroadcast, m>
* Indication: <coDeliver, src, m>

Property:
* Properties of reliable broadcast (RB1, RB2, RB3, RB4)
* CO: If any process pi delivers a message m2, then pi must have delivered every message m1 such that m1 -> m2

Definition of m1 -> m2 : 
m1 -> m2 <=> 
Some process pi broadcasts m1 before m2
Some process pi delivers m1 and then broadcasts m2
There is a message m3 such that m1 -> m3 and m3 -> m2 (transitivity)
(What about pi delivers m1 before m2 ?)

Algorithm
2 processes : 1 sender 1 deliverer, can just use sequence number to send and deliver messages in order.
More than 2 processes : causal order - need to send back the past messages appended to the new message, to keep the context