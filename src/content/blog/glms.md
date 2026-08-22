---
title: "Generalized Linear Models"
description: "An insightful crash course into Generalized Linear Models (GLMs). Trust me, they're so cool."
pubDate: "2025-07-13T22:41:00.655157+00:00"
category: "Projects"
published: true
---

If you've taken a statistics class, you've certainly come across Linear Regression, and possibly other models like Logistic Regression. You may have been taught both seperately, with their respective hypothesis functions being pulled out of thin air, however, they both derive quite beautifully.


This article is my attempt at summarizing Generalized Linear Models, both for the purposes of cementing my own learning, and hopefully helping a rare reader. This article is based entirely off of Andrew Ng's CS229 (Autumn 2018) series. The particular video I learnt from can be found here: [Lecture 4](https://www.youtube.com/watch?v=iZTeva0WSTQ&list=PLoROMvodv4rMiGQp3WXShtMGgzqpfVfbU&index=7). Generalized Linear Models extend naturally from the Exponential Family of statistical distributions, so we'll cover them first.


## Exponential Family

A distribution that is part of the exponential family of distributions must fit the following form:


$$
p(y;\eta) = b(y) \exp(\eta^T T(y) - a(\eta))
$$


Here, $\eta$ is the **natural parameter**, $T(y)$ is the **sufficient statistic** (often, $T(y)=y$) and $a(\eta)$ is the **log-partition function**. $p(y;\eta)$ is the probability density or mass function, depending on whether your chosen distribution is continous or discrete, respectively. The natural parameter $\eta$ is the parameter that appears in the PDF or PMF, for example, in a Bernoulli distribution defined as $\phi^y (1 - \phi)^{1-y}$, $\phi$ will become a function **purely** of $\phi$. To prove a statistical distribution is part of the exponential family, you need to show that it's PDF or PMF can be manipulated to fit the above form.


### Bernoulli Distribution

To illustrate this, we'll use the Bernoulli distribution as an example. We begin by defining the distribution's PMF and slowly manipulating it to fit the exponential family form.


$$
p(y;\phi) = \phi^y (1 - \phi)^{1-y}
$$


$$
= \exp(\ln(\phi^y (1 - \phi)^{1-y}))
$$


$$
= \exp(\ln(\phi^y) + \ln((1 - \phi)^{1-y}))
$$


$$
= \exp(y\ln(\phi) + (1 - \phi)\ln(1 - \phi))
$$


$$
= \exp(y\ln(\phi) + \ln(1 - \phi) - y\ln(1 - \phi))
$$


$$
= \exp(y\ln(\frac{\phi}{1 - \phi}) + \ln(1 - \phi))
$$


We've successfully manipulated the distribution to fit the exponential family definition, provind that the Bernoulli distribution is a family within the exponential family (I'll get into what a family within a family means soon). Doing some pattern matching, we can extract the following *parameters*:


$$
b(y) = 1
$$


$$
\eta = \ln(\frac{\phi}{1 - \phi})
$$

$$
T(y) = y
$$

$$
a(\eta) = -\ln(1 - \phi) = \ln(1 + e^\eta)
$$

The latter definition for $a(\eta)$ can be found by re-arranging the definition for $\eta$ in terms of $\phi$ and simply substituting back into the former definition. This is simple, but is algebraically long, so I won't include it here.


## Constructing GLMs

Constructing GLMs involves the same set of recurring steps. Depending on the task at hand, an appropriate distribution must be chosen, manipulated into the exponential family form, and it's respective set of parameters found. To finally construct the GLM, two **main** assumptions/design-choices need to be made.


- The first design choice is relating $\eta = \theta^T x$ where $\theta, x \in \R^n$. $\theta$ is a set of **learnable** parameters, and $n$ is the number of features you have.
- At test time, the output of the model is the expected value of the distribution, i.e $E[y|x; \theta]$.


GLMs have a nice property whereby their expected value is actually given by the derivative of $a(\eta)$ with respect to $\eta$, which is a lot nicer than the traditional integral approach of calculating the expected value of a random variable or distribution. To convince you of this, I'll write a quick derivation for the expected value of the log-partition that we derived for Bernoulli:


$$
a(\eta) = \ln(1 + e^\eta)
$$

$$
\frac{\partial}{\partial \eta} (\ln(1 + e^\eta)) = \frac{e^\eta}{1 + e^\eta} = \frac{1}{1 + e^{-\eta}}
$$

This is indeed the sigmoid function that we use in Logistic Regression! If you're interested in a similar derivation for Linear Regression using the Gaussian Distribution, I've uploaded full derivations for everything [here](https://github.com/justanotherbyte/papers/blob/main/Generalized%20Linear%20Models.pdf), since the CS229 lecture notes tend to skip over some algebra (which is fair, just some people may want to see all the steps).
