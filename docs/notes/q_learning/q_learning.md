# Reinforcement Learning: Q-Learning \& Deep Q-Learning
* These notes present a [Reinforcement Learning](https://en.wikipedia.org/wiki/Reinforcement_learning) algorithm, namely 
Q-Learning
* Having a Probability, Stochastics and Machine Learning foundation is recommended before reading.
* You do not need to be familiar with Dynamic Programming in the context of Reinforcement Learning.

## Introduction

The goal of Q-Learning is to learn a certain measure of quality of actions given states. This measure of quality represents the long-term expected reward we can get by taking a certain action at a specific state. The higher the expected reward, the better the quality of the action.

## Framework

We have an agent and an environment which interact with each-other in discrete time steps. At time $t$, the agent observes the environment's state $s_t \in \mathcal{S}$, and performs action $a_t \in \mathcal{A}(s_t)$. The agent gets a reward $r_t\in \mathbb{R}$ from performing this action, and the environement changes to state $s_{t+1} \in \mathcal{S}$.  

The state transition follows a distribution $p(s_{t+1}\mid s_t, a_t)$ $\;\forall s_{t+1}\in \mathcal{S}$, and we assume to have the markov property $p(s_{t+1}\mid s_0, a_0, ..., s_t, a_t) = p(s_{t+1}\mid s_t, a_t)$.  

We assume that we don't know the environment's dynamics (model free), so we don't know the state transition $p(s_{t+1}\mid s_t, a_t)$ $\;\forall s_{t+1}\in \mathcal{S}$. In other words, from $s_t, a_t$ we cannot infer anything on $s_{t+1}$.  

We note $\mathcal{S}$ the observable state space, $\mathcal{A}$ the action space. $\mathcal{A}(s)$ is the action space when the state of the environment is $s$, and $\mathcal{A}(s) \subseteq \mathcal{A}$.  

$R: \mathcal{S} \times \mathcal{A} \rightarrow \mathbb{R}$ is the reward function, and $r_t = R(s_t, a_t)$. The notation $r_t$ will be used to denote a random variable that depends on the event $(s_t, a_t)$, and $R(s_t, a_t)$ will be used when we know its value (i.e. when we know $s_t$ and $a_t$).  

We define a policy $\pi$ to be a strategy for the agent. We model it as a function $\pi: \mathcal{A}\times\mathcal{S} \rightarrow [0,1]$ such that for every $s\in\mathcal{S}$, $\sum_{a\in\mathcal{A}(s)} = 1$, so that it defines, for every choice of $s\in\mathcal{S}$ a probability distribution over $\mathcal{A}(s)$, and we denote it with $\pi(a\mid s)$.  

The notation $\mathbb{E}_{\pi}[...]$ means that we sample all actions according to $\pi$, and all states are sampled according to state transition.

## Defining The Goal

Let's start with what we want to achieve. From a state $s$, we want to maximize the expected cumulative reward of our course of action. The expected cumulative reward is what we should obtain on average if we start at a state $s$ and follow our policy to perform actions. The expected cumulative reward is defined as $\mathbb{E}\left[\sum_{i=0}^{\infty}{r_{t+i}} \mid s_t=s\right]$ so our goal is:
$$\max_{\pi}\mathbb{E}_{\pi}\left[\sum_{i=0}^{\infty}{r_{t+i}} \mid s_t=s\right]$$

But summing infinitely many rewards can be infinite. So we slightly change our goal to circumvent this. We prioritize the impact of the most recent rewards over the ones that come later, by introducting a discount factor $\gamma\in ]0, 1[$. We thus define the discounted cumulative reward as being $G_t = r_t + \gamma r_{t+1} + \gamma^2 r_{r+2} + ... = \sum_{i=0}^{\infty}{\gamma^{i}r_{t+i}}$.
The closer $\gamma$ is to 1, the more importance we give to long-term rewards, whereas when $\gamma$ is close to 0, we prioritize short-term rewards. This can be important if for example we are in a game where there are multiple short-term goals that don't end the game but a single long-term goal that ends the game.  

### The V-Function

We can now define the expected discounted cumulative reward when we start at state $s$ and follow policy $\pi$, otherwise known as the State-Value Function (V-function):
 $$V^{\pi}(s) = \mathbb{E}_{\pi}[G_t \mid s_t = s] = \mathbb{E}_{\pi}\left[\sum_{i=0}^{\infty}{\gamma^{i}r_{t+i}} \mid s_t = s\right]$$   
And finally we can state our ultimate goal:
$$\max_{\pi}V^{\pi}(s) \quad\forall s\in\mathcal{S} \tag{1}$$

But, sticking to our assumptions, the V-function is not sufficient. Let's say we want to use the V-function to choose an action based on $s_t$. Then we would choose the action that maximizes the next state's V-function, taking into account the reward obtained from this transition. We would want something similar to 
$$\arg \max_{a_t\in\mathcal{A}(s_t)} R(s_t, a_t) + \gamma\mathbb{E}_{p(s_{t+1}\mid s_t, a_t)}[V^{\pi}(s_{t+1})]$$


The fact that we need to get the next state distribution (i.e. information on the state transition) goes in conflict with our model-free assumption, so the V-function cannot directly be used as a means to choose an action based on the state $s_t$ we're in.  

## The Q-Function

### Definition

Let's introduce a new function, called the Action-Value Function (or Q-function), which is similar to the State-Value Function but takes into account the action that has been chosen. 
$$Q^{\pi}(s,a) = \mathbb{E}_{\pi}[G_t \mid s_t = s, a_t=a] = \mathbb{E}_{\pi}\left[\sum_{i=0}^{\infty}{\gamma^{i}r_{t+i}} \mid s_t = s,a_t=a\right]$$
The intuition of this function is that it gives a measure of the quality of the action we take at a certain state.

### Link To Our Goal

Let's link the Q-function to the V-function.

$$\begin{alignat*}{4}
Q^{\pi}(s,a) &= \mathbb{E}_{\pi}\left[\sum_{i=0}^{\infty}{\gamma^{i}r_{t+i}} \mid s_t = s,a_t=a\right]\\
&= \sum_{s'\in\mathcal{S}}{p(s_{t+1}=s'\mid s_t=s,a_t=a)\mathbb{E}_{\pi}\left[\sum_{i=0}^{\infty}{\gamma^{i}r_{t+i}} \mid s_t = s,a_t=a,s_{t+1}=s'\right]}\\
&= \sum_{s'\in\mathcal{S}}{p(s_{t+1}=s'\mid s_t=s,a_t=a)\left(R(s_t,a_t)+\gamma\mathbb{E}_{\pi}\left[\sum_{i=0}^{\infty}{\gamma^{i}r_{t+1+i}} \mid s_{t+1}=s'\right]\right)}\\
&= R(s_t,a_t) + \gamma\sum_{s'\in\mathcal{S}}{p(s_{t+1}=s'\mid s_t=s,a_t=a)\mathbb{E}_{\pi}\left[\sum_{i=0}^{\infty}{\gamma^{i}r_{t+1+i}} \mid s_{t+1}=s'\right]}
\end{alignat*}$$

$$\Rightarrow \quad Q^{\pi}(s,a) = R(s,a) + \gamma\sum_{s'\in\mathcal{S}}{p(s'\mid s,a)V^{\pi}(s')} \tag{$*$}$$

And the other way around is obtained by summing the conditional expectations on $a_t$:

$$\begin{alignat*}{2}
V^{\pi}(s) &= \mathbb{E}_{\pi}[G_t \mid s_t = s]\\
&= \sum_{a\in \mathcal{A}(s_t)}{\pi(a_t=a\mid s_t=s)\mathbb{E}_{\pi}[G_t \mid s_t = s,a_t=a]}
\end{alignat*}$$

$$\Rightarrow \quad V^{\pi}(s) = \sum_{a\in \mathcal{A}(s)}{\pi(a\mid s)}Q^{\pi}(s,a)\tag{$**$}$$
The above equation is important. It describes the relationship between two fundamental value functions in Reinforcement Learning. It is valid for any policy. 

### Policy Ordering

Let's define what an optimal policy $\pi^*$ is by first defining a partial ordering between policies:  
Let $\pi_1$, $\pi_2$ be two policies. Then,
$$\pi_1 \geq \pi_2 \quad\Leftrightarrow \quad\forall s\in\mathcal{S}\;\;V^{\pi_1}(s) \geq V^{\pi_2}(s)$$
Some policies might not be comparable, for example if there exists $s_1, s_2$ in $\mathcal{S}$ such that $V^{\pi_1}(s_1) > V^{\pi_2}(s_1)$ but $V^{\pi_1}(s_2) < V^{\pi_2}(s_2)$.  
An optimal policy $\pi^*$ is one that is comparable with any other policy $\pi$, and such that $\pi^* \geq \pi$.

A result that we won't prove here but that we'll be using is that, in our setting, $\pi^*$ always exists, and moreover there alway exists a deterministic policy that is optimal. Also note that there can be multiple optimal policies that give the same optimal value, i.e. $\pi^*$ may not be unique.  

We can rewrite our ultimate goal (1) as being $V^*(s) = V^{\pi^*}(s) = \max_{\pi}V^{\pi}(s)$. It is the optimal V-function.  
Similarly, the optimal Q-function is $Q^*(s,a) = Q^{\pi^*}(s,a) = \max_{\pi}Q^{\pi}(s,a)$.  

## Finding The Optimal V-Function Is Equivalent To Finding The Optimal Q-Function

We will now derive an important result, which says that to obtain the values of the optimal V-function, we can concentrate on getting the values of the optimal Q-function. To help derive this important result, we first give the following lemma.

### Policy Improvement Lemma

Lemma (policy improvement): If $\exists \bar{s}\in\mathcal{S}$ such that $V^{\pi}(\bar{s}) < \max_{a\in\mathcal{A}(\bar{s})}{Q^{\pi}(\bar{s},a)}$, then 
$$\exists \pi' \;s.t.\quad V^{\pi}(s) = V^{\pi'}(s) \;\;\forall s\in\mathcal{S}\setminus\{\bar{s}\} \quad\text{and}\quad V^{\pi}(\bar{s})<V^{\pi'}(\bar{s})$$

Proof:  
Let $\bar{a} = \arg\max_{a\in\mathcal{A}(\bar{s})}{Q^{\pi}(\bar{s},a)}$.  
Let $\pi'(a\mid s) = \begin{cases}\pi(a\mid s), & \text{if}\ s\neq\bar{s} \\1, & \text{if}\ s=\bar{s} \text{ and } a=\bar{a} \\0, & \text{otherwise}\end{cases}$  

* $\forall s\in\mathcal{S}\setminus\{\bar{s}\}: V^{\pi}(s)=V^{\pi'}(s)$ because $s\neq\bar{s}$ so $\pi'(a\mid s) = \pi(a\mid s)$.
* If $s=\bar{s}$, $V^{\pi}(\bar{s}) = \sum_{a\in\mathcal{A}(\bar{s})}{\pi(a\mid\bar{s})Q^{\pi}(\bar{s},a)} < \sum_{a\in\mathcal{A}(\bar{s})}{\pi'(a\mid\bar{s})Q^{\pi}(\bar{s},a)}$  
because (lemma assumption) $$\sum_{a\in\mathcal{A}(\bar{s})}{\pi(a\mid\bar{s})Q^{\pi}(\bar{s},a)} = Q^{\pi}(\bar{s},\bar{a}) = \max_{a\in\mathcal{A}(\bar{s})}{Q^{\pi}}(\bar{s},a) > V^{\pi}(\bar{s})$$  
Without loss of generality, let $t$ be the current timestep.  
In what follows, we use multiple times the links derived between the Q-function and the V-function.  
$$\begin{alignat*}{7}
    V^{\pi}(\bar{s}) &< \sum_{a\in\mathcal{A}(\bar{s})}{\pi'(a\mid \bar{s})Q^{\pi}(\bar{s},a)}\\
    &= \mathbb{E}_{\pi'}[Q^{\pi}(s_t,a_t) \mid s_t=\bar{s}]\\
    &=\mathbb{E}_{\pi'}[r_t + \gamma\mathbb{E}_{p}[V^{\pi}(s_{t+1})] \mid s_t=\bar{s}]\\
    &=\mathbb{E}_{\pi'}[r_t + \gamma V^{\pi}(s_{t+1}) \mid s_t=\bar{s}] \quad\text{following our notation}\\
    &\leq \mathbb{E}_{\pi'}[r_t + \gamma Q^{\pi}(s_{t+1}, a_{t+1}) \mid s_t=\bar{s}]\\
\end{alignat*}$$  
The last inequality is obtained with the fact that $V^{\pi}(s_{t+1}) = \mathbb{E}_{\pi}[Q^{\pi}(s_{t+1}, a_{t+1})]$, and if $s_{t+1}\neq \bar{s}$ then $\mathbb{E}_{\pi}[Q^{\pi}(s_{t+1}, a_{t+1})]=\mathbb{E}_{\pi'}[Q^{\pi}(s_{t+1}, a_{t+1})]$, but if $s_{t+1} = \bar{s}$ then $\mathbb{E}_{\pi}[Q^{\pi}(s_{t+1}, a_{t+1})]\leq \max_{a\in\mathcal{A(s_{t+1})}}{Q^{\pi}(s_{t+1}, a)} = \mathbb{E}_{\pi'}[Q^{\pi}(s_{t+1}, a_{t+1})]$. Thus $V^{\pi}(s_{t+1}) \leq \mathbb{E}_{\pi'}[Q^{\pi}(s_{t+1}, a_{t+1})]$. Then the expectation is redundant so we can remove it.  
Repeating the above reasonning we obtain 
$$\begin{alignat*}{7}
    \mathbb{E}_{\pi'}[r_t + \gamma V^{\pi}(s_{t+1}) \mid s_t=\bar{s}] &\leq \mathbb{E}_{\pi'}[r_t + \gamma Q^{\pi}(s_{t+1}, a_{t+1}) \mid s_t=\bar{s}]\\
    &= \mathbb{E}_{\pi'}[r_t + \gamma r_{t+1} + \gamma^2 V^{\pi}(s_{t+2}) \mid s_t=\bar{s}]\\
    &\leq \mathbb{E}_{\pi'}[r_t + \gamma r_{t+1} + \gamma^2 Q^{\pi}(s_{t+2},a_{t+2}) \mid s_t=\bar{s}]\\
    &\;\;\vdots\\
    &\leq \mathbb{E}_{\pi'}[G_t \mid s_t=\bar{s}]\\
    &= V^{\pi'}(\bar{s})
\end{alignat*}$$  
So finally
$$V^{\pi}(\bar{s}) < V^{\pi'}(\bar{s})$$

Now we are ready to state our important result.

### Equivalence Theorem

$$\forall s\in\mathcal{S}, \quad V^*(s) = \max_{a\in\mathcal{A}(s)}Q^*(s,a)$$

Proof:
* Since $(**)$ is valid for any policy, it is valid for an optimal policy. So $V^*(s) = \sum_{a\in\mathcal{A}(s)}{\pi^*(a\mid s)Q^*(s,a)}$. Let $\bar{a}=\arg\max_{a\in\mathcal{A}(s)}Q^*(s,a)$. Then $\sum_{a\in\mathcal{A}(s)}{\pi^*(a\mid s)Q^*(s,a)} \leq \sum_{a\in\mathcal{A}(s)}{\pi^*(a\mid s)Q^*(s,\bar{a})} = Q^*(s,\bar{a}) = \max_{a\in\mathcal{A}(s)}Q^*(s,a)$. Thus $V^*(s) \leq \max_{a\in\mathcal{A}(s)}Q^*(s,a)$.
* We now prove that $V^*(s) \geq \max_{a\in\mathcal{A}(s)}Q^*(s,a) \; \forall s\in\mathcal{S}$ by contradiction. So assume that $\exists \bar{s}\in\mathcal{S}: \;V^*(\bar{s}) < \max_{a\in\mathcal{A}(\bar{s})}Q^*(\bar{s},a)$.  
By our previous lemma, this means that there exists $\pi'$ such that $V^*(\bar{s})<V^{\pi'}(\bar{s})$, which means $\pi^*$ is not optimal $\Rightarrow$ Contradiction.

This is extremely useful, because we can concentrate on computing the optimal Q-values to obtain the optimal V-function values, which is exactly our ultimate goal (1). So computing the optimal Q-values comes back to achieving our goal.  
The whole idea of Q-Learning is learning these optimal Q-values. To put in place our learning framework, we first derive a recursive formula for the optimal Q-function, called the Bellman optimality equation.

Bellman optimality equation for $Q^*$:
$$Q^*(s,a) = R(s,a) +\gamma\sum_{s'\in\mathcal{S}}{p(s'\mid s,a)\max_{a'\in\mathcal{A}(s')}}Q^*(s',a')$$
This is obtained by noting that $(*)$ works in particular with $\pi^*$, and by combining it with $V^*(s)=\max_{a\in\mathcal{A}(s)}Q^*(s,a)$.  

## Q-Learning

Let $\tilde{Q}$ be the function obtained from learning $Q^*$.  
The Bellman optimality equation will help us learn $Q^*(s,a)$ for all $s\in\mathcal{S}, a\in\mathcal{A}(s)$ because our learning objective is minimizing the following error measure:

$$B(s_t,a_t,s_{t+1}) = \tilde{Q}(s_t,a_t) \;-\; \underbrace{(R(s_t,a_t) + \gamma\max_{a\in\mathcal{A}(s_{t+1})}\tilde{Q}(s_{t+1},a))}_{\text{Computed once we can observe}\ s_{t+1}}$$
It is the Bellman error, which is simply the difference between the current Q-value when we're at $s_t$ and about to take $a_t$, and the Q-value computed once we observe the next state $s_{t+1}$. Intuitively, the Bellman error is the update to our expected reward when we observe $s_{t+1}$. The part underlined is the RHS of the Bellman optimality equation, but knowing $s'=s_{t+1}$.  

Q-Learning is an algorithm that repeatedly adjusts $\tilde{Q}$ to minimize the Bellman error. At timestep $t+1$, we sample the tuple $(s_t, a_t, s_{t+1})$ and adjust $\tilde{Q}$ as follows:
$$\tilde{Q}(s_t,a_t) \leftarrow \tilde{Q}(s_t,a_t) - \alpha_t B(s_t,a_t,s_{t+1})$$
Where $\alpha_t$ is a learning rate. In practice $\alpha_t$ will be close to 0 and stricly less than 1 to take into account previous updates.  

Now we state the theoretical constraints under which Q-Learning converges, which helps motivate implementation choices of Q-Learning in practice. The proof of convergence is not given here, but the paper for the proof can be found in [Reference 2](#references). 

### Constraints For Convergence

<ins>Convergence of Q-Learning: </ins> Let $t^{i}(s,a)$ be the timestep of the $i^{\text{th}}$ time that we're in state $s$ and we take action $a$. Let the updates to $\tilde{Q}$ be done as mentioned above. Then, $\tilde{Q}$ converges almost surely towards $Q^*$ as long as
$$\sum_{i=0}^{\infty}{\alpha_{t^{i}(s,a)}}=\infty \quad\text{and}\quad \sum_{i=0}^{\infty}{\left[\alpha_{t^{i}(s,a)}\right]^2}<\infty\quad\forall s\in\mathcal{S},a\in\mathcal{A}$$

The convergence is almost surely because we have random variables $s_t,s_{t+1}$ and $a_t$.  
This statement reveals 2 constraints:
1. The learning rate for each state-action pair $(s,a)$ must converge towards 0, but not too quickly.
2. Because $\alpha_t$ is bounded for all $t$, all state-action pair $(s,a)$ must be visited infinitely often.  

### Exploration-Exploitation tradeoff

Now the idea could be to apply Machine Learning to learn it: we sample a lot of events to adjust and learn each $\tilde{Q}$ so that it is as close as possible to $Q^*$. To do this we don’t need a specific policy, we just need enough exploration and (by the convergence constraints) enough iterations to make the values of $\tilde{Q}$ converge towards $Q^*$.  

But we do Reinforcement Learning, so we also need our agent to get better over experiences. Thus our agent needs to take actions that it thinks are the best according to what it's learned until now. So the agent chooses the actions that maximize $V^*$ for each state, and from the Bellman optimality equation, it chooses $\max_{a} Q^*$.

To give its best guess, the agent always chooses $\arg\max_{a\in\mathcal{A}(s)}Q^*(s,a)$, so it follows the following policy:
$$\pi(a\mid s) = \begin{cases}
      1, & \text{if}\ a=\arg\max_{a'\in\mathcal{A}(s)}Q^*(s,a') \\
      0, & \text{otherwise}
    \end{cases}$$
By identifying the Bellman optimality equation with the Bellman equation in [Appendix](#appendix), we can conclude that this is in fact an optimal policy.  

But this policy doesn't favor exploration, because it always follows the optimal path. Due to this, our agent might never go into certain states (i.e. sample certain state-action pairs), and thus it misses some information that would help get closer to $Q^*$. This is the exploration-exploitation tradeoff: the agent should sometimes choose suboptimal actions in order to visit new states and actions.  
This tradeoff is handled by changing the above optimal (greedy) policy into an $\epsilon$-greedy policy. The idea is that with probability $1-\epsilon$ we apply our optimal policy, and with probability $\epsilon$ we choose an action uniformly at random. Formally, this gives the following policy:
$$
\pi(a\mid s) = \begin{cases}
      (1-\epsilon) + \epsilon\frac{1}{\mid \mathcal{A}(s)\mid}, & \text{if}\ a=\arg\max_{a'\in\mathcal{A}(s)}Q^*(s,a') \\
      \epsilon\frac{1}{\mid \mathcal{A}(s)\mid}, & \text{otherwise}
    \end{cases}
$$
Typically, $\epsilon$ changes as we go through training. It starts with a value close to 1 to favor exploration at the beginning, and decreases to be close to 0 as $\tilde{Q}$ converges to $Q^*$.

Now, with this policy, the agent chooses most of the time the optimal action, while still learning accurately $Q^*$.

### Implementation Pseudocode

We give an implementation of the algorithm:
* **Parameters:** discount factor $\gamma\in]0,1[$, step size (function) $\alpha(t)\in]0,1]$
* **Initialize:** $\tilde{Q}(s,a)$, $\forall (s,a)\in\mathcal{S}\times\mathcal{A}$, arbitrarily. $t\leftarrow 0$.
* **Repeat for each episode:**
    * Initialize state $s_t$
    * **For each step of the episode:**
        * Choose $a_t$ from $s_t$ using the $\epsilon$-greedy policy
        * Take action $a_t$, observe reward $R(s_t, a_t)$ and next state $s'$
        * $\tilde{Q}(s_t, a_t)\leftarrow \tilde{Q}(s_t, a_t) - \alpha_t B(s_t,a_t,s')$
        * $t\leftarrow t+1$
        * $s_t\leftarrow s'$
    * **Until:** $s_t$ ends the episode

Replay Memory trick: To improve the learning of $Q^*$, we can memorize each $(s_t, a_t, s')$ inside a set $E$, and at the end of each episode, we can sample tuples uniformly at random from $E$ and apply the learning process to them. But this has the disadvantage of being slower and more costly.

## Deep-Q-Learning

So far, we've been assuming a tabular representation of the Q-function. There is 1 Q-Value to learn per $(s,a)$ tuple, so the number of Q-Values (size of the table) can go up to $\mathcal{S}\times\mathcal{A}$.  
In practice, $\lvert \mathcal{S} \rvert$ is very big, so having to store all the Q-values in a table is impractical.  
Since for any limited-size set $\mathcal{S}$ we can uniquely represent any $s\in\mathcal{S}$ using $log_2(\lvert \mathcal{S} \rvert)$ bits, it would be better to have a limited-size parameterized function that approximates the Q-function.  

This is what deep Q-Learning is about: have an artificial neural network approximate the Q-function. The network would get a representation of $(s,a)$ as input (achievable using $log_2(\lvert \mathcal{S} \rvert)+log_2(\lvert \mathcal{A} \rvert)$ bits), and it would output an approximate value of $Q(s,a)$.  

Our deep Q-Learning network (Q-network) is noted as $Q_{\theta}$ with parameters to learn $\theta$. The loss we use is the bellman error squared:
$$y_{t,\theta} = R(s_t,a_t) + \gamma\max_{a\in\mathcal{A}(s_{t+1})}Q_{\theta}(s_{t+1},a)$$
$$L(s_t,a_t,s_{t+1}) = \left(Q_{\theta}(s_t,a_t) - y_{t,\theta}\right)^2$$
$y_{t,\theta}$ is the target Q-value and $\theta$ is fixed.

Now, updating Q is done using backpropagation:
$$\theta \leftarrow \theta -\alpha_t\frac{\partial L}{\partial\theta}$$
Where $\frac{\partial L}{\partial\theta} = 2(Q_{\theta}(s_t,a_t) - y_{t,\theta})\frac{\partial Q_{\theta}}{\partial \theta}$.

Notice that, in the loss, we are using the same parameters $\theta$ for the target Q-value and for the predicted Q-value. This gives significant correlation between the target Q-value and $\theta$ that we are learning. So at each training (updating) step, both our predicted Q-value and the target Q-value will shift. We're getting closer to the target, but the target is also moving. This leads to oscillation in training.  
To mitigate this, we can update the target's $\theta$ every $T$ training steps.

### Implementation Pseudocode

Here is an implementation of the algorithm using Q-network $Q_{\theta}$:
* **Parameters:** discount factor $\gamma\in]0,1[$, step size (function) $\alpha(t)\in]0,1]$, $T\in\mathbb{N}^*$
* **Initialize:** $\theta$ using favorite initialization technique. $\theta_T \leftarrow \theta$. $t\leftarrow 0$. $i\leftarrow 0$.
* **Repeat for each episode:**
    * Initialize state $s_t$
    * **For each step of the episode:**
        * Choose $a_t$ from $s_t$ using the $\epsilon$-greedy policy
        * Take action $a_t$, observe reward $R(s_t, a_t)$ and next state $s'$
        * $y_{t,\theta_T} \leftarrow R(s_t,a_t) + \gamma\max_{a\in\mathcal{A}(s')}Q_{\theta_T}(s',a)$
        * $\theta \leftarrow \theta -2\alpha_t(Q_{\theta}(s_t,a_t) - y_{t,\theta_T})\frac{\partial Q_{\theta}}{\partial \theta}$
        * $t\leftarrow t+1$
        * $s_t\leftarrow s'$
        * $i\leftarrow i+1$
        * if $i=T$, $\theta_T \leftarrow \theta$ and $i\leftarrow 0$
    * **Until:** $s_t$ ends the episode

## References

1. The famous book by Richard S. Sutton and Andrew G. Barto - Reinforcement Learning: An Introduction
2. Watkins & Dayan, 1992 - [Almost sure convergence of Q-Learning](https://link.springer.com/article/10.1007/BF00992698)

## Appendix

Bellman equation of the Q-Function:
$$\begin{alignat*}{6}
Q^{\pi}(s,a) &= \mathbb{E}_{\pi}\left[\sum_{i=0}^{\infty}{\gamma^{i}r_{t+i}} \mid s_t = s,a_t=a\right]\\
&= \sum_{s'\in\mathcal{S}}{p(s_{t+1}=s'\mid s_t=s,a_t=a)\mathbb{E}_{\pi}\left[\sum_{i=0}^{\infty}{\gamma^{i}r_{t+i}} \mid s_t = s,a_t=a,s_{t+1}=s'\right]}\\
&= \sum_{s'\in\mathcal{S}}{p(s_{t+1}=s'\mid s_t=s,a_t=a)\left(R(s_t,a_t)+\gamma\mathbb{E}_{\pi}\left[\sum_{i=0}^{\infty}{\gamma^{i}r_{t+1+i}} \mid s_{t+1}=s'\right]\right)}\\
&= R(s_t,a_t) + \sum_{s'\in\mathcal{S}}{p(s_{t+1}=s'\mid s_t=s,a_t=a)\gamma\mathbb{E}_{\pi}\left[\sum_{i=0}^{\infty}{\gamma^{i}r_{t+1+i}} \mid s_{t+1}=s'\right]}\\
&= R(s_t,a_t) + \gamma\sum_{s'\in\mathcal{S}}{p(s_{t+1}=s'\mid s_t=s,a_t=a)\sum_{a'\in\mathcal{A(s_{t+1})}}{\pi(a_{t+1}=a'\mid s_{t+1}=s')\mathbb{E}_{\pi}\left[\sum_{i=0}^{\infty}{\gamma^{i}r_{t+1+i}} \mid s_{t+1}=s',a_{t+1}=a'\right]}}\\
&= R(s_t,a_t) + \gamma\sum_{s'\in\mathcal{S}}{p(s_{t+1}=s'\mid s_t=s,a_t=a)\sum_{a'\in\mathcal{A(s_{t+1})}}{\pi(a_{t+1}=a'\mid s_{t+1}=s')Q^{\pi}(s',a')}}
\end{alignat*}$$
Simplifying the notation:
$$\Rightarrow \quad Q^{\pi}(s,a)= R(s,a)+\gamma\sum_{s'\in\mathcal{S}}{p(s'\mid s,a)\sum_{a'\in\mathcal{A}(s')}{\pi(a'|s')Q^{\pi}(s',a')}}$$

---
Bellman equation of the V-Function: 
$$\begin{alignat*}{7}
    V^{\pi}(s) &= \mathbb{E}_{\pi}\left[\sum_{i=0}^{\infty}{\gamma^{i}r_{t+i}}\mid s_t=s\right]\\
    &= \mathbb{E}_{\pi}\left[r_t + \gamma\sum_{i=1}^{\infty}{\gamma^{i-1}r_{t+i}}\mid s_t=s\right]\\
    &= \mathbb{E}_{\pi}\left[r_t + \gamma\sum_{i=0}^{\infty}{\gamma^{i}r_{t+1+i}}\mid s_t=s\right]\\
    &= \sum_{a\in\mathcal{A(s_t)}}{\pi(a_t=a\mid s_t=s)\mathbb{E}_{\pi}\left[r_t + \gamma\sum_{i=0}^{\infty}{\gamma^{i}r_{t+1+i}} \mid s_t=s, a_t=a\right]}\\
    &= \sum_{a\in\mathcal{A(s_t)}}{\pi(a_t=a\mid s_t=s)\sum_{s'\in\mathcal{S}}{p(s_{t+1}=s'\mid s_t=s,a_t=a)\mathbb{E}_{\pi}\left[r_t + \gamma\sum_{i=0}^{\infty}{\gamma^{i}r_{t+1+i}} \mid s_t=s, a_t=a, s_{t+1}=s'\right]}}\\
    &= \sum_{a\in\mathcal{A(s_t)}}{\pi(a_t=a\mid s_t=s)\sum_{s'\in\mathcal{S}}{p(s_{t+1}=s'\mid s_t=s,a_t=a)\left(R(s_t,a_t)+\gamma\mathbb{E}_{\pi}\left[\sum_{i=0}^{\infty}{\gamma^{i}r_{t+1+i}} \mid s_t=s, a_t=a, s_{t+1}=s'\right]\right)}}\\
    &= \sum_{a\in\mathcal{A(s_t)}}{\pi(a_t=a\mid s_t=s)\sum_{s'\in\mathcal{S}}{p(s_{t+1}=s'\mid s_t=s,a_t=a)\left(R(s_t,a_t)+\gamma V^{\pi}(s')\right)}}\\
\end{alignat*}$$
Simplifying the notation:
$$\Rightarrow \quad V^{\pi}(s)=\sum_{a\in\mathcal{A(s)}}{\pi(a\mid s)\sum_{s'\in\mathcal{S}}{p(s'\mid s,a)\left(R(s,a)+\gamma V^{\pi}(s')\right)}}$$
