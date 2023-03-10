# IPM Part 2: The Lee-Sidford Barrier

* These notes are based on my semester research project in the [Theoretical Computer Science Lab](https://theory.epfl.ch/) at EPFL, where I was supervised by Prof. Dr. Kapralov and Kshiteej Sheth.
* To understand the context in which the objects presented here are used, read my notes on [Interior Point Methods](../IPM/ipm.md).

## 1. Warm-Up: The Logarithmic Barrier

One simple barrier that one can consider for linear constraints is the logarithmic barrier :

**Definition 1: Logarithmic barrier -** Let the $n$-dimentional polytope with $m$ constraints $K = \{Ax \geq b\} = \cap_{i\in [m]}\{a_i^{\top}x \geq b_i\}$. The logarithmic barrier is defined as
$$
\phi(x) = -\sum_{i=1}^{m}{\text{ln}(a_i^{\top}x-b_i)}
$$
To study its self-concordance, we start by proving the following lemma  

**Lemma 1:** *If $\phi_1$ and $\phi_2$ are $\nu_1$- and $\nu_2$-self-concordant barriers on $K_1$ and $K_2$ respectively, then $\phi_1+\phi_2$ is a $\nu_1+\nu_2$-self-concordant barrier on $K_1 \cap K_2$.*  

*Proof.* The two properties of $\nu$-self-concordance ([Definition 4](../IPM/ipm.md)) are validated by just combining the inequalities of self-concordance of $\phi_1$ and $\phi_2$ (and using triangle inequality for the second property).  

<br/>

**Lemma 2:** *The Logarithmic barrier $\phi(x) = -\sum_{i=1}^{m}{\text{ln}(a_i^{\top}x-b_i)}$ is $m$-self-concordant.*  

<br/>

*Proof.* Take any $i\in [m]$ and $\phi_i(x) = -\text{ln}(a_i^{\top}x - b_i)$. Let $s_i = a_i^{\top}x - b_i$.
$$
\text{D}\phi_i(x)[v] = \langle \nabla\phi_i(x), v\rangle = \nabla\phi_i(x)^{\top}v = -\frac{a_i^{\top}v}{s_i}
$$
$$
\text{D}^2\phi_i(x)[v,v] = \langle\nabla\text{D}\phi_i(x)[v], v \rangle = \frac{a_i^{\top}v}{s_i^2}a_i^{\top}v = \left( \frac{a_i^{\top}v}{s_i} \right)^2
$$
$$
\text{D}^3\phi_i(x)[v,v,v] = \langle\nabla\text{D}^2\phi_i(x)[v,v], v \rangle = -2\frac{(a_i^{\top}v)^2}{s_i^3}a_i^{\top}v = -2\left( \frac{a_i^{\top}v}{s_i} \right)^3 \leq 2\left( \frac{a_i^{\top}v}{s_i} \right)^{2\frac{3}{2}} = 2(\text{D}^2\phi_i(x)[v,v])^{\frac{3}{2}}
$$
and we just proved the first property of self-concordance for $\phi_i(x)$.  
Now,
$$
\nabla \phi_i(x) = -\frac{a_i}{s_i} \quad\quad\quad \nabla^2\phi_i(x) = \frac{a_ia_i^{\top}}{s_i^2}
$$
$$\begin{alignat*}{4}
    {\lVert \nabla\phi_i(x) \rVert}_{\nabla^2\phi_i(x)^{-1}}^2 = {\lVert \nabla^2\phi_i(x)^{-1}\nabla\phi_i(x) \rVert}_{\nabla^2\phi_i(x)}^2 &= \nabla\phi_i(x)^{\top}\nabla^2\phi_i(x)^{-1}\nabla\phi_i(x)\\
    &= \frac{a_i^{\top}}{s_i}s_i^2(a_ia_i^{\top})^{-1}\frac{a_i}{s_i} \\
    &= a_i^{\top}(a_ia_i^{\top})^{-1}a_i \\
    &= 1
\end{alignat*}$$
Thus, $\phi_i(x)$ is 1-self-concordant, for any $i\in [m]$.  

Since $\phi(x) = \sum_{i=1}^{m}{\phi_i(x)}$ and by Lemma 1., $\phi(x)$ is $m$-self-concordant.  

From our [IPM framework](../IPM/ipm.md), we conclude that using the logarithmic barrier yields an $O(\sqrt m)$ iteration algorithm for solving Linear Programs. The main problem with this is that since $m$ can get exponential in $n$, this can get very inefficient, for example when the LP has a lot of repeated (or very similar) constraints. The next logical step is to try and reweigh the constraints, and give less weight to the ones that are repeated.

## 2. The Weighted Logarithmic Barrier

We are looking for a barrier that behaves like $-\sum_{i=1}^{m}{w_i \ln(a_i^{\top}x-b_i)}$ for $w_i$ to be determined later. We thus define $\psi(x) = -\sum_{i=1}^{m}{w_i \ln(a_i^{\top}x-b_i)}$ and we will study its self concordance.

**Lemma 3:** *We have* 
$$
\nabla \psi(x)^\top(\nabla^2 \psi(x))^{-1}\nabla \psi(x) \leq \sum_i w_i
$$
And
$$
D^3 \psi(x)[h,h,h] \leq 2 \max_i \left| \frac{\sigma_i(\sqrt W A_x)}{w_i} \right| (D^2 \psi(x)[h,h])^{\frac 3 2}
$$
where $\sigma_i(\sqrt W A_x)$ is the leverage score of $A_x \sqrt W$, namely $\sigma_i(\sqrt W A_x) =(\sqrt W A_x(A_x ^\top W A_x)^{-1}A_x^\top\sqrt{W})_{i,i}$  

*Proof.* We have that $\nabla \psi(x) = A_x^\top w$ and $\nabla^2 \psi(x) = A_x^\top W A_x$. Hence, 
$$
\nabla \psi(x)^\top(\nabla^2 \psi(x))^{-1}\nabla \psi(x) = \sqrt w^\top(\sqrt W A_x(A_x ^\top W A_x)^{-1}A_x^\top\sqrt{W})\sqrt w
$$
But $\sqrt W A_x(A_x ^\top W A_x)^{-1}A_x^\top\sqrt{W}$ is an orthogonal projection matrix, so its operator norm is smaller than $1$. We can then conclude that 
$$
\nabla \psi(x)^\top(\nabla^2 \psi(x))^{-1}\nabla \psi(x) \leq \sqrt w^\top\sqrt w\leq \sum_i w_i
$$
For the second part of the proof, let $s_i = a_i^\top x - b_i$ be the $i$th slack condition. We have 
$$
D^3 \psi(x)[h,h,h] = -2\sum_i w_i \left( \frac{a_i^\top h}{s_i} \right)^3 \leq 2 \max_i \left| \frac{a_i^\top h}{s_i} \right| \sum_i w_i \left( \frac{a_i^\top h}{s_i} \right)^2
$$
Furthermore, 
$$
\left| \frac{a_i^\top h}{s_i} \right|  = \left| \frac{a_i^\top (A_x^\top W A_x)^{-\frac 1 2} (A_x^\top W A_x)^{\frac 1 2} h}{s_i} \right| \leq (A_x(A_x ^\top W A_x)^{-1}A_x^\top)_{i,i} \lVert h \rVert_{\nabla^2 \psi(x)}
$$
Hence, we have 
$$
D^3 \psi(x)[h,h,h] \leq 2 \max_i \left| \frac{\sigma_i(\sqrt W A_x)}{w_i} \right| (D^2 \psi(x)[h,h])^{\frac 3 2}
$$

Rescaling $\psi$ by a constant, we get that 
$$
D^3 \psi(x)[h,h,h] \leq 2 \sum_i w_i \max_i \left| \frac{\sigma_i(\sqrt W A_x)}{w_i} \right| (D^2 \psi(x)[h,h])^{\frac 3 2}
$$
Which gives us a self-concordance factor of $\sum_i w_i \max_i \left| \frac{\sigma_i(\sqrt W A_x)}{w_i} \right|$. It depends on $x$, but if $w_i = \sigma_i(\sqrt W A_x)$, note that we have that  $\sum_i w_i \max_i \left| \frac{\sigma_i(\sqrt W A_x)}{w_i} \right| = \sum_i \sigma_i(\sqrt W A_x) \leq n$ because of the properties of leverage scores.  

Hence with this intuition, we can see how one can try to look for a $O(n)$ self-concordant barrier. The next section will present the actual barrier found by Lee and Sidford, and give some details about it.

## 3. The Lee-Sidford Barrier

As seen in the previous section, we want to weight the $i$th constraint with a weight $w_i$ such that $w_i = \sigma_i(\sqrt W A_x)$. This corresponds exactly to the definition of the $\ell_\infty$ Lewis weights. By their recursive nature, it's very hard to compute them exactly, so one can try to relax those condition to taking $w$ to be the vector of the $\ell_p$ Lewis weights, with $p$ large enough.  

Lee and Sidford introduced the following barrier : 
$$
\phi_p(x) = \max_{w_i \geq 0} \log \det (A_x^\top W^{1-\frac 2 p} A_x) - (1-\frac 2 q)\sum_{i = 1}^m w_i
$$

And proved the following result : 

<br/>

**Theorem 1:** If $A$ has full rank, then for any $p>0$, $\phi_p$ is a $O(n m^{\frac{1}{p+1}})$ self concordant barrier. In particular, for $p = \Theta(\log m), \phi_p$ is a $O(n \log^{O(1)} m)$ self concordant barrier.  

<br/>

The proof is lengthy and can be found in [Reference 1](#references), but one insight that might be interesting is the following (proof omitted):

**Lemma 4:** *We have*
$$
A_x^\top \Sigma_p(x) A_x \preceq \nabla^2 \phi_p(x) \preceq (1+p)A_x^\top \Sigma_p(x) A_x
$$
*Where $\Sigma_p(x)_{i,i}$ is the $i$th $\ell_p$ Lewis weight of $A_x$.*  

This lemma is insightful because it shows that the hessian of $\phi_p$ is spectrally close to $A_x^\top \Sigma_p(x) A_x$, which is the Hessian of the $\ell_p$ Lewis weights reweighted logarithmic barrier, and this can justify why the Lee-Sidford barrier behaves as wanted.

## 4. Putting it all together

We have exhibited a $\tilde{O}(n)$ self-concordant barrier, which can be used to get a $\tilde{O}(\sqrt n \log(1/\epsilon)$ iteration algorithm to solve Linear Programs. One important thing to study now is the per iteration cost, in particular the cost to compute the barrier. The Lee-Sidford is very costly to compute because it involves determinants, and $\ell_p$ Lewis weights. Not being careful about how one computes it might ruin all our previous efforts.  

The idea is to compute the barrier iteratively: the broad picture is that from $\phi_p(x)$, $x$, and $x'$, if $x$ and $x'$ are close enough, one can estimate  $\phi_p(x') - \phi_p(x)$ with satisfactory precision, because $\phi_p$ is smooth enough. Furthermore, computing $\phi_p(x')$ from $\phi_p(x)$ only takes a logarithmic number of linear systems to solve. We can now state the final result of Lee and Sidford :

<br/>

**Theorem 2:** Given an interior point $x_0$ of a Linear Program, there exists an algorithm that outputs a feasible point $x$ such that $c^\top x \leq \text{OPT} + \epsilon$ with constant probability in $\tilde{O}(\sqrt n \log(1/\epsilon) \mathcal{T}_w)$ time, where $\mathcal{T}_w$ is the work needed to compute $(A^\top D A)^{-1}q$ for a positive diagonal matrix $D$ and a vector $q$.  

<br/>

Depending on the nature of the Linear Program, $\mathcal{T}_w$ might vary, and as such, the most general result with state of the art techniques states that one can solve approximately a Linear Program in time $\tilde{O}((nnz(A) + rank(A)^\omega)\sqrt n\log(1/\epsilon))$ where $\omega$ is the constant multiplication matrix.

## References

1. Y. T. Lee, A. Sidford - [Solving Linear Programs with sqrt(rank) linear system solves](https://arxiv.org/abs/1910.08033)